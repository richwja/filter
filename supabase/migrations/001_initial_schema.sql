-- ORGANIZATION + AUTH

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  name text,
  slack_user_id text,
  org_id uuid REFERENCES organizations(id),
  role text DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  status text DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'paused', 'archived')),
  receiving_address text,
  slack_channel_id text,
  slack_workspace_id text,
  media_sheet_url text,
  media_sheet_column_mapping jsonb,
  media_sheet_last_sync_at timestamptz,
  client_context text,
  scoring_weights jsonb DEFAULT '{"urgency": 0.4, "impact": 0.35, "risk": 0.25}',
  sensitive_topics text[] DEFAULT '{}',
  notification_threshold float DEFAULT 6.0,
  auto_assign_rules jsonb DEFAULT '[]',
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, slug)
);

CREATE TABLE project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) NOT NULL,
  user_id uuid REFERENCES users(id) NOT NULL,
  role text DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- EMAIL + TRIAGE

CREATE TABLE emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) NOT NULL,
  message_id text NOT NULL,
  thread_id text,
  direction text DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound')),
  from_address text,
  from_name text,
  to_addresses text[],
  cc_addresses text[],
  subject text,
  body_text text,
  body_html text,
  received_at timestamptz,
  attachments jsonb DEFAULT '[]',
  raw_headers jsonb,
  status text DEFAULT 'ingested' CHECK (status IN (
    'ingested', 'classified', 'filtered', 'enriched', 'ranked', 'published', 'error'
  )),
  error_message text,
  processing_started_at timestamptz,
  processing_completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, message_id)
);

CREATE INDEX idx_emails_project_status ON emails(project_id, status);
CREATE INDEX idx_emails_project_received ON emails(project_id, received_at DESC);

CREATE TABLE triage_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id uuid REFERENCES emails(id) NOT NULL UNIQUE,
  project_id uuid REFERENCES projects(id) NOT NULL,
  category text,
  sender_type text,
  outlet_name text,
  beat_topics text[] DEFAULT '{}',
  is_deadline_driven boolean DEFAULT false,
  estimated_deadline timestamptz,
  sentiment text,
  summary text,
  requires_response boolean DEFAULT true,
  touches_sensitive_topic boolean DEFAULT false,
  classification_confidence float,
  impact_score int,
  urgency_score int,
  risk_score int,
  composite_score float,
  recommended_action text,
  recommended_owner_role text,
  reasoning text,
  talking_points text[] DEFAULT '{}',
  flags text[] DEFAULT '{}',
  follow_up_suggestion text,
  draft_reply_subject text,
  draft_reply_body text,
  draft_reply_tone text,
  draft_reply_requires_approval boolean DEFAULT false,
  draft_reply_approval_reason text,
  assigned_to uuid REFERENCES users(id),
  assigned_at timestamptz,
  status text DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'replied', 'closed', 'no_action')),
  status_changed_at timestamptz,
  replied_at timestamptz,
  context_packet jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_triage_project_composite ON triage_results(project_id, composite_score DESC);
CREATE INDEX idx_triage_project_status ON triage_results(project_id, status);

-- RELATIONSHIPS

CREATE TABLE media_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) NOT NULL,
  name text,
  email text,
  phone text,
  mobile text,
  outlet text,
  title text,
  beat text,
  tier int CHECK (tier BETWEEN 1 AND 3),
  relationship_status text DEFAULT 'unknown' CHECK (relationship_status IN (
    'strong', 'warm', 'cold', 'new', 'unknown'
  )),
  past_coverage_sentiment text,
  social_handle text,
  notes text,
  source text DEFAULT 'manual' CHECK (source IN ('manual', 'sheet_sync', 'auto_discovered', 'csv_import')),
  sheet_row_index int,
  last_interaction_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_contacts_project_email ON media_contacts(project_id, email);

CREATE TABLE interaction_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) NOT NULL,
  contact_id uuid REFERENCES media_contacts(id),
  email_id uuid REFERENCES emails(id),
  interaction_type text,
  outcome text,
  summary text,
  occurred_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- COMPANY CONTEXT

CREATE TABLE press_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) NOT NULL,
  title text NOT NULL,
  content text,
  summary text,
  topics text[] DEFAULT '{}',
  key_quotes jsonb DEFAULT '[]',
  spokesperson text,
  status text DEFAULT 'published' CHECK (status IN ('published', 'embargoed', 'draft')),
  published_at timestamptz,
  source_url text,
  source_type text DEFAULT 'upload' CHECK (source_type IN ('upload', 'url', 'gdrive')),
  gdrive_file_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE writing_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) NOT NULL,
  label text,
  content text NOT NULL,
  context text,
  sample_type text CHECK (sample_type IN ('press_statement', 'email_reply', 'comment', 'decline', 'holding_statement')),
  tone text,
  created_at timestamptz DEFAULT now()
);

-- SYSTEM

CREATE TABLE prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) NOT NULL,
  prompt_type text NOT NULL CHECK (prompt_type IN ('classify', 'rank')),
  content text NOT NULL,
  version int NOT NULL,
  is_active boolean DEFAULT false,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, prompt_type, version)
);

CREATE TABLE saved_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) NOT NULL,
  user_id uuid REFERENCES users(id) NOT NULL,
  name text NOT NULL,
  filters jsonb NOT NULL,
  sort_column text DEFAULT 'composite_score',
  sort_direction text DEFAULT 'desc',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE pipeline_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) NOT NULL,
  email_id uuid REFERENCES emails(id),
  step text NOT NULL,
  status text NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'retried')),
  duration_ms int,
  error_message text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE triage_results;
ALTER PUBLICATION supabase_realtime ADD TABLE emails;
