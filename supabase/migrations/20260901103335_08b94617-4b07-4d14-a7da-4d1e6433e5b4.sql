-- Bystander Mode: a passer-by who scans a RESQR ID can activate an emergency
-- on behalf of an unconscious victim, without an account. All writes flow
-- through this single SECURITY DEFINER function so anon keeps zero table access.

CREATE OR REPLACE FUNCTION public.bystander_activate_emergency(
  _code text,
  _latitude double precision DEFAULT NULL,
  _longitude double precision DEFAULT NULL,
  _accuracy double precision DEFAULT NULL,
  _note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  rec public.resqr_ids;
  prof public.profiles;
  guardian public.emergency_contacts;
  em public.emergencies;
  sess public.guardian_sessions;
  recent_count int;
  clean_note text := NULLIF(btrim(left(COALESCE(_note, ''), 300)), '');
BEGIN
  IF _code IS NULL OR length(_code) < 16 OR length(_code) > 64 THEN
    RAISE EXCEPTION 'Invalid RESQR ID';
  END IF;

  SELECT * INTO rec FROM public.resqr_ids WHERE code = _code AND active = true LIMIT 1;
  IF rec IS NULL THEN
    RAISE EXCEPTION 'This RESQR ID is not valid';
  END IF;

  SELECT * INTO prof FROM public.profiles WHERE id = rec.user_id;

  -- Abuse guard: cap bystander activations per RESQR owner per hour.
  SELECT count(*) INTO recent_count
  FROM public.emergencies
  WHERE user_id = rec.user_id
    AND type = 'bystander'
    AND started_at > now() - interval '1 hour';
  IF recent_count >= 5 THEN
    RAISE EXCEPTION 'Too many activations for this RESQR ID. Please call emergency services directly.';
  END IF;

  SELECT * INTO guardian FROM public.emergency_contacts
    WHERE user_id = rec.user_id
    ORDER BY is_guardian DESC, position ASC
    LIMIT 1;

  -- Idempotency: never open a second emergency while one is already running.
  SELECT * INTO em FROM public.emergencies
    WHERE user_id = rec.user_id AND status NOT IN ('resolved', 'cancelled')
    ORDER BY started_at DESC
    LIMIT 1;

  IF em IS NULL THEN
    INSERT INTO public.emergencies (
      user_id, type, severity, status, live_status, relay_state,
      latitude, longitude, notes, location_updated_at
    ) VALUES (
      rec.user_id, 'bystander', 'high', 'active', 'help_requested', 'created',
      _latitude, _longitude,
      COALESCE(clean_note, 'Activated by a bystander who scanned this RESQR ID.'),
      CASE WHEN _latitude IS NOT NULL THEN now() END
    )
    RETURNING * INTO em;

    INSERT INTO public.emergency_events (emergency_id, user_id, label, detail)
    VALUES (em.id, em.user_id, 'SOS activated by bystander',
            COALESCE(clean_note, 'A bystander scanned the RESQR ID and requested help.'));

    IF _latitude IS NOT NULL AND _longitude IS NOT NULL THEN
      INSERT INTO public.location_pings (emergency_id, user_id, latitude, longitude, accuracy)
      VALUES (em.id, em.user_id, _latitude, _longitude, _accuracy);
      INSERT INTO public.emergency_events (emergency_id, user_id, label, detail)
      VALUES (em.id, em.user_id, 'Bystander location captured',
              round(_latitude::numeric, 5) || ', ' || round(_longitude::numeric, 5));
    END IF;

    INSERT INTO public.notifications (user_id, category, title, body)
    VALUES (em.user_id, 'emergency', 'Emergency activated by a bystander',
            'Someone scanned your RESQR ID and requested help on your behalf.');
  ELSE
    -- Same incident: log the extra scan instead of duplicating the emergency.
    INSERT INTO public.emergency_events (emergency_id, user_id, label, detail)
    VALUES (em.id, em.user_id, 'Bystander joined the active emergency',
            COALESCE(clean_note, 'A bystander scanned the RESQR ID during this emergency.'));
  END IF;

  -- One Guardian session per emergency, reused when it already exists.
  SELECT * INTO sess FROM public.guardian_sessions
    WHERE emergency_id = em.id AND active = true LIMIT 1;
  IF sess IS NULL THEN
    INSERT INTO public.guardian_sessions (
      user_id, emergency_id, guardian_contact_id, guardian_name,
      guardian_email, guardian_phone, token
    ) VALUES (
      em.user_id, em.id, guardian.id,
      COALESCE(guardian.name, 'Trusted contact'),
      guardian.email, guardian.phone,
      replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
    )
    RETURNING * INTO sess;
  END IF;

  RETURN jsonb_build_object(
    'emergency_id', em.id,
    'reference', upper(substring(em.id::text, 1, 8)),
    'already_active', em.type <> 'bystander' OR em.started_at < now() - interval '5 seconds',
    'victim_name', COALESCE(prof.full_name, 'RESQORA user'),
    'guardian_name', sess.guardian_name,
    'guardian_email', sess.guardian_email,
    'guardian_phone', sess.guardian_phone,
    'guardian_token', sess.token,
    'started_at', em.started_at
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.bystander_activate_emergency(text, double precision, double precision, double precision, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bystander_activate_emergency(text, double precision, double precision, double precision, text) TO anon, authenticated;