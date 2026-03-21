import { Router } from 'express';
import { supabase } from '../db/supabase';

const router = Router({ mergeParams: true });

function pid(req: { params: Record<string, string> }) {
  return (req.params as { projectId: string }).projectId;
}

router.get('/', async (req, res) => {
  const { sort_by = 'name', sort_dir = 'asc' } = req.query;
  const validSortColumns = [
    'name',
    'email',
    'outlet',
    'tier',
    'relationship_status',
    'last_interaction_at',
    'created_at',
  ];
  const column = validSortColumns.includes(sort_by as string) ? (sort_by as string) : 'name';

  const { data, error } = await supabase
    .from('media_contacts')
    .select('*')
    .eq('project_id', pid(req))
    .order(column, { ascending: sort_dir === 'asc' });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ contacts: data ?? [] });
});

router.post('/', async (req, res) => {
  const allowed = [
    'name',
    'email',
    'phone',
    'mobile',
    'outlet',
    'title',
    'beat',
    'tier',
    'relationship_status',
    'social_handle',
    'notes',
    'source',
  ];
  const insert: Record<string, unknown> = { project_id: pid(req) };
  for (const key of allowed) {
    if (req.body[key] !== undefined) insert[key] = req.body[key];
  }

  const { data, error } = await supabase.from('media_contacts').insert(insert).select().single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ contact: data });
});

router.patch('/:id', async (req, res) => {
  const allowed = [
    'name',
    'email',
    'phone',
    'mobile',
    'outlet',
    'title',
    'beat',
    'tier',
    'relationship_status',
    'social_handle',
    'notes',
  ];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const { data, error } = await supabase
    .from('media_contacts')
    .update(updates)
    .eq('id', req.params.id)
    .eq('project_id', pid(req))
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
    .eq('project_id', pid(req))
    .order('occurred_at', { ascending: false })
    .limit(20);

  res.json({ interactions: data ?? [] });
});

export default router;
