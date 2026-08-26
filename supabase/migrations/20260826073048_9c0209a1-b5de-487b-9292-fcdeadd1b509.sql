alter table public.emergencies
  add column if not exists relay_state text not null default 'created',
  add column if not exists notified_at timestamptz,
  add column if not exists ack_at timestamptz,
  add column if not exists ack_by text,
  add column if not exists escalated_at timestamptz,
  add column if not exists escalation_level integer not null default 0,
  add column if not exists ack_timeout_seconds integer not null default 120;

do $do$ begin
  alter table public.emergencies add constraint emergencies_relay_state_check
    check (relay_state in ('created','notified','waiting_for_ack','acknowledged','responding','resolved','cancelled'));
exception when duplicate_object then null; end $do$;

alter table public.guardian_sessions
  add column if not exists opened_at timestamptz,
  add column if not exists acknowledged_at timestamptz;

create or replace function public.guardian_acknowledge(_emergency_id uuid, _token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  sess public.guardian_sessions;
  em public.emergencies;
begin
  sess := public.guardian_session_for(_emergency_id, _token);
  if sess.id is null then raise exception 'Guardian link is not valid'; end if;

  select * into em from public.emergencies where id = sess.emergency_id;
  if em is null then raise exception 'Emergency not found'; end if;
  if em.status in ('resolved','cancelled') then
    return jsonb_build_object('acknowledged', false, 'reason', 'closed');
  end if;

  if em.ack_at is null then
    update public.emergencies
      set ack_at = now(),
          ack_by = sess.guardian_name,
          relay_state = 'responding',
          live_status = 'assistance_en_route'
      where id = em.id;
    update public.guardian_sessions set acknowledged_at = now() where id = sess.id;
    insert into public.emergency_events (emergency_id, user_id, label, detail)
    values (em.id, em.user_id, 'Guardian acknowledged',
            sess.guardian_name || ' is responding to this emergency.');
    insert into public.notifications (user_id, category, title, body)
    values (em.user_id, 'emergency', 'Guardian is responding',
            sess.guardian_name || ' acknowledged your emergency and is on the way.');
  end if;

  select * into em from public.emergencies where id = sess.emergency_id;
  return jsonb_build_object('acknowledged', true, 'relay_state', em.relay_state,
    'ack_at', em.ack_at, 'ack_by', em.ack_by);
end; $$;

revoke all on function public.guardian_acknowledge(uuid, text) from public;
grant execute on function public.guardian_acknowledge(uuid, text) to anon, authenticated;

create or replace function public.get_guardian_relay(_emergency_id uuid, _token text)
returns jsonb
language plpgsql
stable security definer
set search_path to 'public'
as $$
declare
  sess public.guardian_sessions;
  em public.emergencies;
begin
  sess := public.guardian_session_for(_emergency_id, _token);
  if sess.id is null then return null; end if;
  select * into em from public.emergencies where id = sess.emergency_id;
  if em is null then return null; end if;
  return jsonb_build_object(
    'relay_state', em.relay_state,
    'notified_at', em.notified_at,
    'ack_at', em.ack_at,
    'ack_by', em.ack_by,
    'escalated_at', em.escalated_at,
    'escalation_level', em.escalation_level,
    'ack_timeout_seconds', em.ack_timeout_seconds,
    'guardian_opened_at', sess.opened_at,
    'guardian_acknowledged_at', sess.acknowledged_at
  );
end; $$;

revoke all on function public.get_guardian_relay(uuid, text) from public;
grant execute on function public.get_guardian_relay(uuid, text) to anon, authenticated;

create or replace function public.escalate_unacknowledged(_emergency_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  em public.emergencies;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into em from public.emergencies where id = _emergency_id and user_id = auth.uid();
  if em is null then raise exception 'Emergency not found'; end if;

  if em.ack_at is not null
     or em.status in ('resolved','cancelled')
     or em.notified_at is null
     or em.escalation_level > 0
     or now() < em.notified_at + make_interval(secs => em.ack_timeout_seconds) then
    return jsonb_build_object('escalated', false, 'relay_state', em.relay_state);
  end if;

  update public.emergencies
    set escalation_level = 1, escalated_at = now()
    where id = em.id and escalation_level = 0;
  if not found then
    return jsonb_build_object('escalated', false, 'relay_state', em.relay_state);
  end if;

  insert into public.emergency_events (emergency_id, user_id, label, detail)
  values (em.id, em.user_id, 'Escalated to backup contacts',
          'No Guardian acknowledgement within ' || em.ack_timeout_seconds || ' seconds.');

  return jsonb_build_object('escalated', true, 'relay_state', em.relay_state);
end; $$;

revoke all on function public.escalate_unacknowledged(uuid) from public, anon;
grant execute on function public.escalate_unacknowledged(uuid) to authenticated;

create or replace function public.log_guardian_access(_emergency_id uuid, _token text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  sess public.guardian_sessions;
begin
  sess := public.guardian_session_for(_emergency_id, _token);
  if sess.id is null then return; end if;

  if sess.opened_at is null then
    update public.guardian_sessions set opened_at = now() where id = sess.id;
    insert into public.emergency_events (emergency_id, user_id, label, detail)
    values (sess.emergency_id, sess.user_id, 'Guardian opened notification', sess.guardian_name);
  end if;

  insert into public.security_events (user_id, event, detail, metadata)
  values (sess.user_id, 'Guardian access',
    sess.guardian_name || ' opened the Guardian dashboard',
    jsonb_build_object('emergency_id', sess.emergency_id, 'guardian_session', sess.id));

  if not exists (
    select 1 from public.emergency_events e
    where e.emergency_id = sess.emergency_id
      and e.label = 'Guardian opened dashboard'
      and e.created_at > now() - interval '1 hour'
  ) then
    insert into public.emergency_events (emergency_id, user_id, label, detail)
    values (sess.emergency_id, sess.user_id, 'Guardian opened dashboard', sess.guardian_name);
  end if;
end; $$;