-- Nzinga Talent OS — initial schema

CREATE TYPE talent_stage AS ENUM (
  'holding_entry', 'scout_complete', 'team1_review', 'ops_processing',
  'team2_audit', 'executive_review', 'signed_onboarding', 'archived', 'not_viable'
);

CREATE TYPE user_role AS ENUM (
  'scout', 'team1_lead', 'ops_specialist', 'team2_lead', 'director', 'success_manager'
);

CREATE TYPE application_status AS ENUM ('sent', 'in_progress', 'submitted');

CREATE TYPE task_priority AS ENUM ('urgent', 'high', 'medium', 'low');
CREATE TYPE task_status AS ENUM ('open', 'done', 'cancelled');
CREATE TYPE history_type AS ENUM ('note', 'call', 'email', 'task', 'document', 'system');

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  role user_role NOT NULL,
  email TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE talents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  stage talent_stage NOT NULL DEFAULT 'holding_entry',
  niches JSONB DEFAULT '[]',
  scout_id TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL,
  social_handle TEXT DEFAULT '',
  follower_count TEXT DEFAULT '',
  er_pct TEXT DEFAULT '',
  platform TEXT DEFAULT '',
  location TEXT DEFAULT '',
  pillar_scores JSONB DEFAULT '[0,0,0,0,0]',
  pillar_rationales JSONB DEFAULT '["","","","",""]',
  jordan_score NUMERIC DEFAULT 0,
  revenue_path TEXT DEFAULT '',
  scout_summary TEXT DEFAULT '',
  team1_notes TEXT DEFAULT '',
  team1_decision TEXT,
  compliance JSONB DEFAULT '{}',
  rep_type TEXT DEFAULT '',
  commission TEXT DEFAULT '',
  term_length TEXT DEFAULT '',
  team2_notes TEXT DEFAULT '',
  team2_decision TEXT,
  director_decision TEXT,
  portal_setup BOOLEAN DEFAULT FALSE,
  technical_routing BOOLEAN DEFAULT FALSE,
  warm_handoff TEXT DEFAULT '',
  warm_handoff_confirmed BOOLEAN DEFAULT FALSE,
  revenue_ytd TEXT DEFAULT '0',
  revenue_projected TEXT DEFAULT '0',
  last_contacted TEXT,
  application_id TEXT,
  application_status TEXT,
  uploaded_docs JSONB DEFAULT '{}',
  audit_log JSONB DEFAULT '[]'
);

CREATE TABLE applications (
  id TEXT PRIMARY KEY,
  talent_id TEXT REFERENCES talents(id),
  access_code TEXT NOT NULL,
  talent_name TEXT NOT NULL,
  talent_email TEXT NOT NULL,
  status application_status NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMPTZ NOT NULL,
  last_saved TIMESTAMPTZ,
  completed_sections JSONB DEFAULT '[]',
  data JSONB DEFAULT '{}'
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  assigned_to TEXT REFERENCES users(id),
  related_talent TEXT REFERENCES talents(id),
  due DATE,
  priority task_priority NOT NULL,
  status task_status NOT NULL DEFAULT 'open',
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL,
  notes TEXT DEFAULT ''
);

CREATE TABLE history (
  id TEXT PRIMARY KEY,
  talent_id TEXT REFERENCES talents(id),
  user_id TEXT REFERENCES users(id),
  type history_type NOT NULL,
  text TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL,
  flagged BOOLEAN DEFAULT FALSE,
  is_document BOOLEAN DEFAULT FALSE,
  doc_name TEXT,
  doc_type TEXT,
  doc_data TEXT
);

CREATE TABLE uploaded_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id TEXT NOT NULL REFERENCES talents(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE talents ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_docs ENABLE ROW LEVEL SECURITY;

-- Directors see all talents; others filtered by stage in app layer + policies
CREATE POLICY talents_director_all ON talents FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid()::text AND u.role = 'director')
  );

CREATE POLICY applications_public_read ON applications FOR SELECT
  USING (true);

CREATE POLICY applications_public_write ON applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY applications_public_update ON applications FOR UPDATE
  USING (true);

-- Storage bucket (run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
