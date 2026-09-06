DELETE FROM public.emergency_alert_deliveries d
USING public.emergency_alert_deliveries keep
WHERE d.emergency_id = keep.emergency_id
  AND d.kind = keep.kind
  AND d.channel = keep.channel
  AND COALESCE(d.contact_id, '00000000-0000-0000-0000-000000000000'::uuid)
      = COALESCE(keep.contact_id, '00000000-0000-0000-0000-000000000000'::uuid)
  AND (keep.created_at, keep.id) < (d.created_at, d.id);

CREATE UNIQUE INDEX IF NOT EXISTS emergency_alert_deliveries_unique_event
  ON public.emergency_alert_deliveries (
    emergency_id,
    kind,
    channel,
    COALESCE(contact_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

CREATE INDEX IF NOT EXISTS emergency_alert_deliveries_user_recent_idx
  ON public.emergency_alert_deliveries (user_id, channel, created_at DESC);