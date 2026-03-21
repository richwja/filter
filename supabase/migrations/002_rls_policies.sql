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

-- Helper functions (SECURITY DEFINER bypasses RLS)
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

CREATE OR REPLACE FUNCTION get_own_role()
RETURNS text AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_own_org_id()
RETURNS uuid AS $$
  SELECT org_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ORGANIZATIONS: users see own org, admins see all
CREATE POLICY "org_own" ON organizations
  FOR SELECT USING (id = get_own_org_id());
CREATE POLICY "org_admin" ON organizations
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- USERS: see own org, update self (cannot change own role), admins manage
CREATE POLICY "users_read_own_org" ON users
  FOR SELECT USING (org_id = get_own_org_id() OR is_admin());
CREATE POLICY "users_update_self" ON users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = get_own_role());
CREATE POLICY "users_admin_read" ON users
  FOR SELECT USING (is_admin());
CREATE POLICY "users_admin_write" ON users
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- PROJECT MEMBERS
CREATE POLICY "members_read" ON project_members
  FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "members_admin" ON project_members
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- PROJECTS
CREATE POLICY "projects_read" ON projects
  FOR SELECT USING (is_project_member(id) OR is_admin());
CREATE POLICY "projects_write" ON projects
  FOR UPDATE USING (is_project_member(id) OR is_admin())
  WITH CHECK (is_project_member(id) OR is_admin());
CREATE POLICY "projects_insert" ON projects
  FOR INSERT WITH CHECK (
    is_admin() OR org_id = get_own_org_id()
  );
CREATE POLICY "projects_delete" ON projects
  FOR DELETE USING (is_admin() AND status = 'archived');

-- PROJECT-SCOPED TABLES
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'emails', 'triage_results', 'media_contacts', 'interaction_history',
    'press_releases', 'writing_samples', 'pipeline_logs'
  ])
  LOOP
    EXECUTE format(
      'CREATE POLICY "member_select" ON %I FOR SELECT USING (is_project_member(project_id))',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "member_insert" ON %I FOR INSERT WITH CHECK (is_project_member(project_id))',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "member_update" ON %I FOR UPDATE USING (is_project_member(project_id)) WITH CHECK (is_project_member(project_id))',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "admin_all" ON %I FOR ALL USING (is_admin()) WITH CHECK (is_admin())',
      tbl
    );
  END LOOP;
END $$;

-- PROMPT VERSIONS: only admins write
CREATE POLICY "prompt_read" ON prompt_versions
  FOR SELECT USING (is_project_member(project_id) OR is_admin());
CREATE POLICY "prompt_write" ON prompt_versions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- SAVED VIEWS: users own their views
CREATE POLICY "views_read" ON saved_views
  FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "views_insert" ON saved_views
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_project_member(project_id));
CREATE POLICY "views_update" ON saved_views
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND is_project_member(project_id));
CREATE POLICY "views_delete" ON saved_views
  FOR DELETE USING (user_id = auth.uid() OR is_admin());
