-- Los 46 permits seedeados antes del deploy del trigger permits_log_event
-- (migration 20260511000005) quedaron sin evento 'created'. Esto rompe
-- PermitEventsTimeline y LocationHistoryTab.
-- Backfill: generar evento 'created' usando el created_at del permit mismo.

INSERT INTO permit_events (permit_id, actor_id, event_type, to_value, metadata, created_at)
SELECT
  p.id,
  NULL,
  'created',
  p.type,
  jsonb_build_object('backfilled', true, 'reason', 'legacy_seed_pre_trigger'),
  p.created_at
FROM permits p
WHERE NOT EXISTS (
  SELECT 1 FROM permit_events e
  WHERE e.permit_id = p.id
    AND e.event_type = 'created'
);
