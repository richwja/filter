import { Router } from 'express';
import { supabase } from '../db/supabase';

const router = Router({ mergeParams: true });

const VALID_SORT = [
  'composite_score',
  'created_at',
  'updated_at',
  'category',
  'status',
  'urgency_score',
  'impact_score',
  'risk_score',
];

function pid(req: { params: Record<string, string> }) {
  return req.params.projectId;
}

router.get('/', async (req, res) => {
  const {
    status,
    category,
    min_score,
    max_score,
    flags,
    assigned_to,
    sort_by = 'composite_score',
    sort_dir = 'desc',
    page = '1',
    per_page = '50',
  } = req.query;

  const column = VALID_SORT.includes(sort_by as string) ? (sort_by as string) : 'composite_score';

  let query = supabase
    .from('triage_results')
    .select('*, emails!inner(subject, from_name, from_address, received_at)', { count: 'exact' })
    .eq('project_id', pid(req));

  if (status) query = query.eq('status', status);
  if (category) query = query.eq('category', category);
  if (min_score) query = query.gte('composite_score', Number(min_score));
  if (max_score) query = query.lte('composite_score', Number(max_score));
  if (assigned_to) query = query.eq('assigned_to', assigned_to);
  if (flags) query = query.overlaps('flags', (flags as string).split(','));

  const limit = Math.min(Math.max(Number(per_page) || 50, 1), 100);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

  const { data, count, error } = await query
    .order(column, { ascending: sort_dir === 'asc' })
    .range(offset, offset + limit - 1);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ results: data ?? [], total: count ?? 0 });
});

router.get('/:id', async (req, res) => {
  const { data } = await supabase
    .from('triage_results')
    .select('*, emails(*)')
    .eq('id', req.params.id)
    .eq('project_id', pid(req))
    .single();

  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json({ result: data });
});

router.patch('/:id', async (req, res) => {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (req.body.status !== undefined) {
    updates.status = req.body.status;
    updates.status_changed_at = updates.updated_at;
  }
  if (req.body.assigned_to !== undefined) {
    updates.assigned_to = req.body.assigned_to;
    updates.assigned_at = updates.updated_at;
  }

  if (Object.keys(updates).length <= 1) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  const { data, error } = await supabase
    .from('triage_results')
    .update(updates)
    .eq('id', req.params.id)
    .eq('project_id', pid(req))
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ result: data });
});

export default router;
