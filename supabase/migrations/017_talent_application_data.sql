-- Store the full application questionnaire on the talent row so specialty
-- answers (acting, modeling, sports, influencing) persist with the profile.
-- Extra applicant-profile fields that are not dedicated columns live in `profile`.

ALTER TABLE public.talents
  ADD COLUMN IF NOT EXISTS application_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS profile jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.talents.application_data IS
  'Full copy of applications.data (acting/modeling/sports/influencing answers, uploads refs).';
COMMENT ON COLUMN public.talents.profile IS
  'Applicant profile extras not mapped to dedicated talents columns.';
