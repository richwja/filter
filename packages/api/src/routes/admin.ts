import { Router } from 'express';
import { supabase } from '../db/supabase';
import { requireAuth } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';

const router = Router();
router.use(requireAuth, adminOnly);

router.get('/pipeline', async (req, res) => {
  const { project_id, status } = req.query;
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);

  let query = supabase
    .from('pipeline_logs')
    .select('*, emails(subject, from_address)')
    .order('created_at', { ascending: false })
    .limit(limit);

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

const VALID_PROMPT_TYPES = ['classify', 'rank'];

router.put('/prompts/:projectId', async (req, res) => {
  const { prompt_type, content } = req.body;

  if (!prompt_type || !VALID_PROMPT_TYPES.includes(prompt_type)) {
    return res.status(400).json({ error: 'Invalid prompt_type. Must be "classify" or "rank".' });
  }
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Content is required' });
  }

  // Get next version + deactivate + insert in sequence (not atomic but validated)
  const { data: latest } = await supabase
    .from('prompt_versions')
    .select('version')
    .eq('project_id', req.params.projectId)
    .eq('prompt_type', prompt_type)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (latest?.version ?? 0) + 1;

  await supabase
    .from('prompt_versions')
    .update({ is_active: false })
    .eq('project_id', req.params.projectId)
    .eq('prompt_type', prompt_type)
    .eq('is_active', true);

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
