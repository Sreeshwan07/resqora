-- RESQORA hardening: SOS server-side idempotency + hot-path indexes

-- 1. Database-level guard: a user can only ever have ONE live emergency
--    session (status not resolved/cancelled). A second INSERT in the same
--    state violates this unique index, so a double-tap or a race between
--    two tabs can never create a duplicate live session.
CREATE UNIQUE INDEX IF NOT EXISTS emergencies_one_live_per_user
  ON public.emergencies (user_id)
  WHERE status NOT IN ('resolved', 'cancelled');

-- 2. Atomic session creation. One transaction: reuses the user's running
--    emergency when one exists, otherwise inserts a fresh session. The
--    unique index guarantees even truly concurrent calls yield exactly one
--    live session; the loser returns the winner's row (reused = true).
CREATE OR REPLACE FUNCTION public.start_emergency_session(
  _type text,
  _severity text,
  _notes text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  caller uuid := auth.uid();
  existing public.emergencies;
  created public.emergencies;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO existing
    FROM public.emergencies
   WHERE user_id = caller
     AND status NOT IN ('resolved', 'cancelled')
   ORDER BY started_at DESC
   LIMIT 1
   FOR UPDATE;

  IF existing.id IS NOT NULL THEN
    RETURN jsonb_build_object('emergency', to_jsonb(existing), 'reused', true);
  END IF;

  BEGIN
    INSERT INTO public.emergencies (user_id, type, severity, status, notes)
    VALUES (
      caller,
      COALESCE(NULLIF(_type, ''), 'sos'),
      COALESCE(NULLIF(_severity, ''), 'high'),
      'created',
      NULLIF(_notes, '')
    )
    RETURNING * INTO created;

    RETURN jsonb_build_object('emergency', to_jsonb(created), 'reused', false);
  EXCEPTION WHEN unique_violation THEN
    SELECT * INTO existing
      FROM public.emergencies
     WHERE user_id = caller
       AND status NOT IN ('resolved', 'cancelled')
     ORDER BY started_at DESC
     LIMIT 1;
    IF existing.id IS NULL THEN
      RAISE EXCEPTION 'Could not start the emergency session';
    END IF;
    RETURN jsonb_build_object('emergency', to_jsonb(existing), 'reused', true);
  END;
END;
$function$;

REVOKE ALL ON FUNCTION public.start_emergency_session(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_emergency_session(text, text, text) TO authenticated;

-- 3. Hot-path indexes: these tables are read by emergency_id in the
--    Guardian dashboard, live tracking and resolution flows.
CREATE INDEX IF NOT EXISTS guardian_sessions_emergency_idx
  ON public.guardian_sessions(emergency_id);

CREATE INDEX IF NOT EXISTS share_links_emergency_kind_idx
  ON public.share_links(emergency_id, kind)
  WHERE kind = 'live';

CREATE INDEX IF NOT EXISTS accident_media_incident_idx
  ON public.accident_media(incident_id, created_at DESC);