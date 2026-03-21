import { Router } from 'express';
import { supabase } from '../db/supabase';
import { requireAuth } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';

const router = Router();
router.use(requireAuth, adminOnly);

router.get('/pipeline', async (req, res) => {
  const { project_id, status, limit = '100' } = req.query;

  let query = supabase
    .from('pipeline_logs')
    .select('*, emails(subject, from_address)')
    .order('created_at', { ascending: false })
    .limit(Number(limit));

  if (project_id) query = query.eq('project_id', project_id);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json({ logs: data ?? [] });
});

router.get('/prompts/:projectId', async (req, res) => {
  const { data } = await supabase
    .from('prompt_versions')
    .select('*')
    .eq('project_id', req.params.projectId)
    .order('version', { ascending: false });

  res.json({ prompts: data ?? [] });
});

router.put('/prompts/:projectId', async (req, res) => {
  const { prompt_type, content } = req.body;

  // Get next version number
  const { data: latest } = await supabase
    .from('prompt_versions')
    .select('version')
    .eq('project_id', req.params.projectId)
    .eq('prompt_type', prompt_type)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (latest?.version ?? 0) + 1;

  // Deactivate current active
  await supabase
    .from('prompt_versions')
    .update({ is_active: false })
    .eq('project_id', req.params.projectId)
    .eq('prompt_type', prompt_type)
    .eq('is_active', true);

  // Insert new version
  const { data, error } = await supabase
    .from('prompt_versions')
    .insert({
      project_id: req.params.projectId,
      prompt_type,
      content,
      version: nextVersion,
      is_active: true,
      created_by: req.user!.id,
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ prompt: data });
});

export default router;
