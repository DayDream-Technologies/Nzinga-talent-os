ALTER TABLE public.talents ADD COLUMN IF NOT EXISTS application_data jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.talents ADD COLUMN IF NOT EXISTS profile jsonb NOT NULL DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.talents.application_data IS 'Full copy of applications.data (acting/modeling/sports/influencing answers, upload refs).';
COMMENT ON COLUMN public.talents.profile IS 'Applicant profile extras not mapped to dedicated talents columns.';;
