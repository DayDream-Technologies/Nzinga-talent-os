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
  AND data::text LIKE '%data:image%';;
