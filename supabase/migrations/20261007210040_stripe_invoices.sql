-- Brand invoice totals live here so checkout cannot trust a browser-supplied amount.
-- The webhook is the only writer of paid / processing / failed.

CREATE TABLE IF NOT EXISTS client_invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT,
  client_name TEXT NOT NULL,
  talent_name TEXT,
  project TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  tax_cents INTEGER NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'processing', 'paid', 'failed', 'overdue', 'partial')),
  due_at DATE,
  paid_at TIMESTAMPTZ,
  stripe_checkout_session_id TEXT,
  checkout_url TEXT,
  stripe_payment_intent_id TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_invoices_payment_intent_idx
  ON client_invoices (stripe_payment_intent_id);

ALTER TABLE client_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_invoices_staff_read ON client_invoices;
CREATE POLICY client_invoices_staff_read ON client_invoices
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid()));

DROP POLICY IF EXISTS client_invoices_staff_insert ON client_invoices;
CREATE POLICY client_invoices_staff_insert ON client_invoices
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid()));

GRANT SELECT, INSERT ON client_invoices TO authenticated;

CREATE TABLE IF NOT EXISTS escrow_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id TEXT NOT NULL UNIQUE REFERENCES client_invoices (id),
  client_name TEXT NOT NULL,
  talent_name TEXT,
  project TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  stripe_payment_intent_id TEXT,
  notes TEXT NOT NULL DEFAULT 'Collected by Stripe. Payout lands in the Chase escrow account configured in Stripe.'
);

ALTER TABLE escrow_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS escrow_receipts_staff_read ON escrow_receipts;
CREATE POLICY escrow_receipts_staff_read ON escrow_receipts
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users u WHERE u.auth_uid = auth.uid()));

GRANT SELECT ON escrow_receipts TO authenticated;

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON stripe_webhook_events FROM anon, authenticated;

INSERT INTO client_invoices (id, invoice_number, client_name, talent_name, project, amount_cents, tax_cents, status, due_at, paid_at)
VALUES
  ('inv_nike_1', 'INV-2026-001', 'Nike', 'Maya Rivera', '$10,000 Commercial Shoot', 1000000, 88800, 'sent', '2026-09-13', NULL),
  ('inv_nike_2', 'INV-2026-002', 'Nike', 'Leo Park', 'Lifestyle Lookbook Day Rate', 450000, 39900, 'sent', '2026-09-09', NULL),
  ('inv_nike_3', 'INV-2026-003', 'Nike', 'Ava Brooks', 'Beauty Campaign Still Set', 620000, 55000, 'sent', '2026-09-10', NULL),
  ('inv_nike_4', 'INV-2026-004', 'Nike', 'Maya Rivera', 'Usage Buyout — Social Cutdowns', 280000, 0, 'sent', '2026-09-11', NULL),
  ('inv_maya_paid', 'INV-2026-000', 'Nike', 'Maya Rivera', 'Spring Lookbook Day Rate', 350000, 0, 'paid', '2026-07-02', '2026-06-28T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
