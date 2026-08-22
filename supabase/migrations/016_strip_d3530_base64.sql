-- Strip embedded base64 file payloads from D3530 (app_1787363691384).
-- Storage uploads failed with 400s; the client fell back to data: URLs in JSONB (~1.5 MB).

UPDATE public.applications
SET data = (
  SELECT COALESCE(
    jsonb_object_agg(
      key,
      CASE
        WHEN key LIKE 'doc_%'
          AND jsonb_typeof(value) = 'string'
          AND value::text LIKE '"data:%'
        THEN 'null'::jsonb
        ELSE value
      END
    ),
    '{}'::jsonb
  )
  FROM jsonb_each(data)
)
WHERE id = 'app_1787363691384'
  AND data::text LIKE '%data:image%';
