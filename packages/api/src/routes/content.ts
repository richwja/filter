import { Router } from 'express';
import { supabase } from '../db/supabase';

const router = Router({ mergeParams: true });

function pid(req: { params: Record<string, string> }) {
  return (req.params as { projectId: string }).projectId;
}

router.get('/press-releases', async (req, res) => {
  const { data } = await supabase
    .from('press_releases')
    .select('*')
    .eq('project_id', pid(req))
    .order('published_at', { ascending: false });

  res.json({ press_releases: data ?? [] });
});

router.post('/press-releases', async (req, res) => {
  const allowed = [
    'title',
    'content',
    'summary',
    'topics',
    'key_quotes',
    'spokesperson',
    'status',
    'published_at',
    'source_url',
    'source_type',
  ];
  const insert: Record<string, unknown> = { project_id: pid(req) };
  for (const key of allowed) {
    if (req.body[key] !== undefined) insert[key] = req.body[key];
  }

  const { data, error } = await supabase.from('press_releases').insert(insert).select().single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ press_release: data });
});

router.get('/writing-samples', async (req, res) => {
  const { data } = await supabase
    .from('writing_samples')
    .select('*')
    .eq('project_id', pid(req))
    .order('created_at', { ascending: false });

  res.json({ writing_samples: data ?? [] });
});

router.post('/writing-samples', async (req, res) => {
  const allowed = ['label', 'content', 'context', 'sample_type', 'tone'];
  const insert: Record<string, unknown> = { project_id: pid(req) };
  for (const key of allowed) {
    if (req.body[key] !== undefined) insert[key] = req.body[key];
  }

  const { data, error } = await supabase.from('writing_samples').insert(insert).select().single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ writing_sample: data });
});

router.patch('/client-context', async (req, res) => {
  const { data, error } = await supabase
    .from('projects')
    .update({ client_context: req.body.client_context, updated_at: new Date().toISOString() })
    .eq('id', pid(req))
    .select('id, client_context')
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ project: data });
});

export default router;
