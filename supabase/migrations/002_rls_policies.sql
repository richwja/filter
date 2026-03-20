-- Enable RLS on all project-scoped tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE press_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_logs ENABLE ROW LEVEL SECURITY;

-- Helper: project member access
CREATE OR REPLACE FUNCTION is_project_member(p_project_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: admin check
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Project members: see own memberships
CREATE POLICY "members_own" ON project_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "members_admin" ON project_members
  USING (is_admin());

-- Projects: members or admin
CREATE POLICY "projects_member" ON projects
  FOR SELECT USING (
    id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "projects_admin" ON projects USING (is_admin());

-- Generic project-scoped policies (applied per table)
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'emails', 'triage_results', 'media_contacts', 'interaction_history',
    'press_releases', 'writing_samples', 'prompt_versions', 'saved_views', 'pipeline_logs'
  ])
  LOOP
    EXECUTE format(
      'CREATE POLICY "project_member_access" ON %I FOR SELECT USING (is_project_member(project_id))',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "admin_full_access" ON %I USING (is_admin())',
      tbl
    );
  END LOOP;
END $$;
