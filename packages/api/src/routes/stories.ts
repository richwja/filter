import { Router } from 'express';
import { supabase } from '../db/supabase';

const router = Router({ mergeParams: true });

function pid(req: { params: Record<string, string> }) {
  return req.params.projectId;
}

// List stories for a project
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('stories')
    .select('*, story_members(triage_id)')
    .eq('project_id', pid(req))
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ stories: data ?? [] });
});

// Generate stories from triage data (stub)
router.post('/generate', async (_req, res) => {
  res.status(501).json({
    error: 'Not implemented',
    description:
      'Auto-generate narrative stories by clustering triage results using LLM. Coming soon.',
  });
});

// Update a story (owner, status, title)
router.patch('/:id', async (req, res) => {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (req.body.owner_id !== undefined) updates.owner_id = req.body.owner_id;
  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.title !== undefined) updates.title = req.body.title;
  if (req.body.summary !== undefined) updates.summary = req.body.summary;
  if (req.body.priority !== undefined) updates.priority = req.body.priority;

  if (Object.keys(updates).length <= 1) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  const { data, error } = await supabase
    .from('stories')
    .update(updates)
    .eq('id', req.params.id)
    .eq('project_id', pid(req))
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Story not found' });
  res.json({ story: data });
});

export default router;
