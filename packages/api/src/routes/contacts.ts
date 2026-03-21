import { Router } from 'express';
import { supabase } from '../db/supabase';
import { requireAuth } from '../middleware/auth';

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { sort_by = 'name', sort_dir = 'asc' } = req.query;

  const { data, error } = await supabase
    .from('media_contacts')
    .select('*')
    .eq('project_id', (req.params as { projectId: string }).projectId)
    .order(sort_by as string, { ascending: sort_dir === 'asc' });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ contacts: data ?? [] });
});

router.post('/', async (req, res) => {
  const { data, error } = await supabase
    .from('media_contacts')
    .insert({ ...req.body, project_id: (req.params as { projectId: string }).projectId })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ contact: data });
});

router.patch('/:id', async (req, res) => {
  const updates = { ...req.body, updated_at: new Date().toISOString() };
  delete updates.id;
  delete updates.project_id;

  const { data, error } = await supabase
    .from('media_contacts')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ contact: data });
});

router.get('/:id/interactions', async (req, res) => {
  const { data } = await supabase
    .from('interaction_history')
    .select('*')
    .eq('contact_id', req.params.id)
    .order('occurred_at', { ascending: false })
    .limit(20);

  res.json({ interactions: data ?? [] });
});

export default router;
