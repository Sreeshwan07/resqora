CREATE OR REPLACE FUNCTION public.start_emergency_session(
  _type text,
  _severity text,
  _notes text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
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

  -- Reuse the running emergency instead of racing to create a duplicate.
  -- RLS (user owns their emergencies) applies because this is SECURITY INVOKER.
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
    -- Lost the race: another caller created the live session first.
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