import { Router } from 'express';
import { supabase } from '../db/supabase';
import { requireAuth } from '../middleware/auth';

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.get('/press-releases', async (req, res) => {
  const { data } = await supabase
    .from('press_releases')
    .select('*')
    .eq('project_id', (req.params as { projectId: string }).projectId)
    .order('published_at', { ascending: false });

  res.json({ press_releases: data ?? [] });
});

router.post('/press-releases', async (req, res) => {
  const { data, error } = await supabase
    .from('press_releases')
    .insert({ ...req.body, project_id: (req.params as { projectId: string }).projectId })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ press_release: data });
});

router.get('/writing-samples', async (req, res) => {
  const { data } = await supabase
    .from('writing_samples')
    .select('*')
    .eq('project_id', (req.params as { projectId: string }).projectId)
    .order('created_at', { ascending: false });

  res.json({ writing_samples: data ?? [] });
});

router.post('/writing-samples', async (req, res) => {
  const { data, error } = await supabase
    .from('writing_samples')
    .insert({ ...req.body, project_id: (req.params as { projectId: string }).projectId })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ writing_sample: data });
});

router.patch('/client-context', async (req, res) => {
  const { data, error } = await supabase
    .from('projects')
    .update({ client_context: req.body.client_context, updated_at: new Date().toISOString() })
    .eq('id', (req.params as { projectId: string }).projectId)
    .select('id, client_context')
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ project: data });
});

export default router;
