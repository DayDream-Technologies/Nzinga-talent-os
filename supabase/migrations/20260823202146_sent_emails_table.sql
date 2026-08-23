-- Audit log for emails sent via the send-email Edge Function.
CREATE TABLE IF NOT EXISTS public.sent_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_user_id text NOT NULL REFERENCES public.users(id),
  sender_name text NOT NULL,
  sender_email text NOT NULL,
  from_display text NOT NULL,
  reply_to text,
  to_email text NOT NULL,
  to_name text,
  subject text NOT NULL,
  provider_id text,
  company_code text NOT NULL DEFAULT 'NZG',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sent_emails ENABLE ROW LEVEL SECURITY;

-- Staff can read sent email logs within their org
CREATE POLICY sent_emails_staff_read ON public.sent_emails
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_uid = (SELECT auth.uid())
    )
  );

-- Only the Edge Function (service_role) inserts rows
GRANT SELECT ON public.sent_emails TO authenticated;
GRANT ALL ON public.sent_emails TO service_role;

CREATE INDEX idx_sent_emails_company_code ON public.sent_emails (company_code);
CREATE INDEX idx_sent_emails_created_at ON public.sent_emails (created_at DESC);
