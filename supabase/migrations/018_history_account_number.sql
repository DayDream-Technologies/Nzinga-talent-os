-- CRM notes on clients/prospects are keyed by account number. talent_id still
-- references pipeline talents(id) and stays null until a matching pipeline row exists.

ALTER TABLE public.history
  ADD COLUMN IF NOT EXISTS account_number text;

CREATE INDEX IF NOT EXISTS idx_history_account_number
  ON public.history (account_number)
  WHERE account_number IS NOT NULL;

COMMENT ON COLUMN public.history.account_number IS
  'NZG account number for CRM notes when talent_id is not a pipeline talents.id.';
