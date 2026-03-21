import { Router } from 'express';
import { supabase } from '../db/supabase';

const router = Router({ mergeParams: true });

function pid(req: { params: Record<string, string> }) {
  return (req.params as { projectId: string }).projectId;
}

function getDateRange(range: string): string {
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

router.get('/sentiment', async (req, res) => {
  const since = getDateRange((req.query.range as string) || '30d');

  const { data } = await supabase
    .from('triage_results')
    .select('sentiment, created_at')
    .eq('project_id', pid(req))
    .gte('created_at', since);

  const grouped: Record<string, Record<string, number>> = {};
  for (const row of data ?? []) {
    const date = row.created_at.slice(0, 10);
    grouped[date] ??= { positive: 0, neutral: 0, negative: 0, urgent: 0 };
    if (row.sentiment) grouped[date][row.sentiment] = (grouped[date][row.sentiment] || 0) + 1;
  }

  const result = Object.entries(grouped)
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.json({ data: result });
});

router.get('/topics', async (req, res) => {
  const since = getDateRange((req.query.range as string) || '30d');

  const { data } = await supabase
    .from('triage_results')
    .select('beat_topics, created_at')
    .eq('project_id', pid(req))
    .gte('created_at', since);

  const topicCounts: Record<string, number> = {};
  for (const row of data ?? []) {
    for (const topic of row.beat_topics ?? []) {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    }
  }

  const result = Object.entries(topicCounts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  res.json({ data: result });
});

router.get('/volume', async (req, res) => {
  const since = getDateRange((req.query.range as string) || '30d');

  const { data } = await supabase
    .from('triage_results')
    .select('category, created_at')
    .eq('project_id', pid(req))
    .gte('created_at', since);

  const grouped: Record<string, Record<string, number>> = {};
  for (const row of data ?? []) {
    const date = row.created_at.slice(0, 10);
    grouped[date] ??= {};
    const cat = row.category || 'other';
    grouped[date][cat] = (grouped[date][cat] || 0) + 1;
  }

  const result = Object.entries(grouped)
    .map(([date, cats]) => ({ date, ...cats }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.json({ data: result });
});

router.get('/scores', async (req, res) => {
  const { data } = await supabase
    .from('triage_results')
    .select('composite_score')
    .eq('project_id', pid(req))
    .not('composite_score', 'is', null);

  const buckets = Array.from({ length: 10 }, (_, i) => ({
    range: `${i}-${i + 1}`,
    count: 0,
  }));

  for (const row of data ?? []) {
    const idx = Math.max(0, Math.min(Math.floor(row.composite_score), 9));
    buckets[idx].count++;
  }

  res.json({ data: buckets });
});

export default router;
