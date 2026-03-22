CREATE TABLE stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  summary text,
  owner_id uuid,
  priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE story_members (
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE,
  triage_id uuid REFERENCES triage_results(id) ON DELETE CASCADE,
  PRIMARY KEY (story_id, triage_id)
);

CREATE INDEX idx_stories_project_id ON stories(project_id);
CREATE INDEX idx_story_members_triage_id ON story_members(triage_id);
