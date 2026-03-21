import { Router } from 'express';
import { supabase } from '../db/supabase';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.get('/', async (req, res) => {
  // Admins see all projects in their org
  if (req.user!.role === 'admin') {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('org_id', req.user!.org_id)
      .order('created_at', { ascending: false });
    return res.json({ projects: data ?? [] });
  }

  const { data: memberships } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', req.user!.id);

  if (!memberships?.length) return res.json({ projects: [] });

  const ids = memberships.map((m) => m.project_id);
  const { data } = await supabase
    .from('projects')
    .select('*')
    .in('id', ids)
    .order('created_at', { ascending: false });

  res.json({ projects: data ?? [] });
});

router.post('/', async (req, res) => {
  const { name, slug, receiving_address } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      org_id: req.user!.org_id,
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      receiving_address,
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  await supabase.from('project_members').insert({
    project_id: project.id,
    user_id: req.user!.id,
    role: 'owner',
  });

  res.status(201).json({ project });
});

router.get('/:id', async (req, res) => {
  if (!UUID_RE.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid project ID' });
  }

  // Check access
  if (req.user!.role !== 'admin') {
    const { data: membership } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', req.params.id)
      .eq('user_id', req.user!.id)
      .maybeSingle();
    if (!membership) return res.status(403).json({ error: 'Not a member of this project' });
  }

  const { data } = await supabase.from('projects').select('*').eq('id', req.params.id).single();

  if (!data) return res.status(404).json({ error: 'Project not found' });
  res.json({ project: data });
});

router.patch('/:id', async (req, res) => {
  if (!UUID_RE.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid project ID' });
  }

  if (req.user!.role !== 'admin') {
    const { data: membership } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', req.params.id)
      .eq('user_id', req.user!.id)
      .maybeSingle();
    if (!membership) return res.status(403).json({ error: 'Not a member of this project' });
  }

  const allowed = [
    'name',
    'status',
    'receiving_address',
    'slack_channel_id',
    'slack_workspace_id',
    'media_sheet_url',
    'media_sheet_column_mapping',
    'client_context',
    'scoring_weights',
    'sensitive_topics',
    'notification_threshold',
    'auto_assign_rules',
    'config',
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ project: data });
});

export default router;
