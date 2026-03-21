-- Enable RLS on ALL tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
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

-- Helper functions
CREATE OR REPLACE FUNCTION is_project_member(p_project_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ORGANIZATIONS: users can see their own org, admins see all
CREATE POLICY "org_own" ON organizations
  FOR SELECT USING (
    id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );
CREATE POLICY "org_admin" ON organizations USING (is_admin());

-- USERS: users can see own org members, admins see all, only admins can update role
CREATE POLICY "users_read_own_org" ON users
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users u WHERE u.id = auth.uid())
    OR is_admin()
  );
CREATE POLICY "users_update_self" ON users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM users WHERE id = auth.uid()));
CREATE POLICY "users_admin" ON users USING (is_admin());

-- PROJECT MEMBERS
CREATE POLICY "members_read" ON project_members
  FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "members_admin" ON project_members
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- PROJECTS
CREATE POLICY "projects_read" ON projects
  FOR SELECT USING (
    id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
    OR is_admin()
  );
CREATE POLICY "projects_write" ON projects
  FOR UPDATE USING (is_project_member(id) OR is_admin());
CREATE POLICY "projects_insert" ON projects
  FOR INSERT WITH CHECK (is_admin() OR true);
CREATE POLICY "projects_admin" ON projects
  FOR DELETE USING (is_admin());

-- PROJECT-SCOPED TABLES: read + write for members, full access for admins
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'emails', 'triage_results', 'media_contacts', 'interaction_history',
    'press_releases', 'writing_samples', 'pipeline_logs'
  ])
  LOOP
    -- Members can read
    EXECUTE format(
      'CREATE POLICY "member_select" ON %I FOR SELECT USING (is_project_member(project_id))',
      tbl
    );
    -- Members can insert/update
    EXECUTE format(
      'CREATE POLICY "member_write" ON %I FOR INSERT WITH CHECK (is_project_member(project_id))',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "member_update" ON %I FOR UPDATE USING (is_project_member(project_id))',
      tbl
    );
    -- Admins can do everything
    EXECUTE format(
      'CREATE POLICY "admin_all" ON %I FOR ALL USING (is_admin()) WITH CHECK (is_admin())',
      tbl
    );
  END LOOP;
END $$;

-- PROMPT VERSIONS: only admins can write
CREATE POLICY "prompt_read" ON prompt_versions
  FOR SELECT USING (is_project_member(project_id) OR is_admin());
CREATE POLICY "prompt_write" ON prompt_versions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- SAVED VIEWS: users see own views within their projects
CREATE POLICY "views_read" ON saved_views
  FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "views_write" ON saved_views
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_project_member(project_id));
CREATE POLICY "views_update" ON saved_views
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "views_delete" ON saved_views
  FOR DELETE USING (user_id = auth.uid() OR is_admin());
