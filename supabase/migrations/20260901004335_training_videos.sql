-- TMX Academy training videos. Directors add/edit/delete; staff read role-targeted rows.

CREATE TABLE IF NOT EXISTS public.training_videos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_code TEXT NOT NULL REFERENCES public.company_codes(code),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL DEFAULT '',
  storage_path TEXT,
  target_roles TEXT[] NOT NULL DEFAULT '{}',
  created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT training_videos_source_chk CHECK (
    length(trim(video_url)) > 0 OR coalesce(storage_path, '') <> ''
  )
);

CREATE INDEX IF NOT EXISTS training_videos_company_idx
  ON public.training_videos (company_code, created_at DESC);

ALTER TABLE public.training_videos ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.staff_can_view_training(target_company text, target_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.auth_uid = auth.uid()
      AND COALESCE(u.active, true)
      AND u.company_code = target_company
      AND (
        u.role = 'director'
        OR COALESCE(cardinality(target_roles), 0) = 0
        OR u.role = ANY (target_roles)
      )
  );
$$;

REVOKE ALL ON FUNCTION public.staff_can_view_training(text, text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_can_view_training(text, text[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.staff_can_view_training(text, text[]) TO authenticated, service_role;

DROP POLICY IF EXISTS training_videos_staff_select ON public.training_videos;
CREATE POLICY training_videos_staff_select ON public.training_videos
  FOR SELECT TO authenticated
  USING (public.staff_can_view_training(company_code, target_roles));

DROP POLICY IF EXISTS training_videos_director_insert ON public.training_videos;
CREATE POLICY training_videos_director_insert ON public.training_videos
  FOR INSERT TO authenticated
  WITH CHECK (public.staff_is_company_director(company_code));

DROP POLICY IF EXISTS training_videos_director_update ON public.training_videos;
CREATE POLICY training_videos_director_update ON public.training_videos
  FOR UPDATE TO authenticated
  USING (public.staff_is_company_director(company_code))
  WITH CHECK (public.staff_is_company_director(company_code));

DROP POLICY IF EXISTS training_videos_director_delete ON public.training_videos;
CREATE POLICY training_videos_director_delete ON public.training_videos
  FOR DELETE TO authenticated
  USING (public.staff_is_company_director(company_code));

GRANT SELECT ON public.training_videos TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.training_videos TO authenticated;
GRANT ALL ON public.training_videos TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'training-videos',
  'training-videos',
  false,
  104857600,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE OR REPLACE FUNCTION public.staff_can_manage_training_storage(object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT public.staff_is_company_director((storage.foldername(object_name))[1]);
$$;

CREATE OR REPLACE FUNCTION public.staff_can_read_training_storage(object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.auth_uid = auth.uid()
      AND COALESCE(u.active, true)
      AND u.company_code = (storage.foldername(object_name))[1]
  );
$$;

REVOKE ALL ON FUNCTION public.staff_can_manage_training_storage(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_can_read_training_storage(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_can_manage_training_storage(text) FROM anon;
REVOKE ALL ON FUNCTION public.staff_can_read_training_storage(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.staff_can_manage_training_storage(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.staff_can_read_training_storage(text) TO authenticated, service_role;

DROP POLICY IF EXISTS "Directors can upload training videos" ON storage.objects;
CREATE POLICY "Directors can upload training videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'training-videos'
    AND public.staff_can_manage_training_storage(name)
  );

DROP POLICY IF EXISTS "Directors can update training videos" ON storage.objects;
CREATE POLICY "Directors can update training videos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'training-videos'
    AND public.staff_can_manage_training_storage(name)
  )
  WITH CHECK (
    bucket_id = 'training-videos'
    AND public.staff_can_manage_training_storage(name)
  );

DROP POLICY IF EXISTS "Directors can delete training videos" ON storage.objects;
CREATE POLICY "Directors can delete training videos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'training-videos'
    AND public.staff_can_manage_training_storage(name)
  );

DROP POLICY IF EXISTS "Staff can view training videos" ON storage.objects;
CREATE POLICY "Staff can view training videos"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'training-videos'
    AND public.staff_can_read_training_storage(name)
  );
