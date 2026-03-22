import type { TriageRow } from '@/hooks/useTriageRealtime';
import { THEMES } from './themes';

// Reverse-lookup: find which theme a triage row belongs to based on outlet+sender
const seedLookup = new Map<string, string>();
for (const theme of THEMES) {
  for (const seed of theme.seeds) {
    seedLookup.set(`${seed[1]}|${seed[2]}`, theme.title);
  }
}

function getRowTopic(row: TriageRow): string | null {
  const key = `${row.emails?.from_name}|${row.emails?.from_address}`;
  return seedLookup.get(key) ?? null;
}

function getDaysForRange(range: string): number {
  return range === '7d' ? 7 : range === '90d' ? 90 : 30;
}

function filterByRange(rows: TriageRow[], range: string): TriageRow[] {
  const days = getDaysForRange(range);
  const since = new Date('2026-03-22T18:00:00Z');
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();
  return rows.filter((r) => r.created_at >= sinceIso);
}

export interface DemoAnalyticsResult {
  sentiment: {
    date: string;
    positive: number;
    neutral: number;
    negative: number;
    urgent: number;
  }[];
  topics: { topic: string; count: number }[];
  volume: Record<string, unknown>[];
  scores: { range: string; count: number }[];
}

export function computeDemoAnalytics(rows: TriageRow[], range: string): DemoAnalyticsResult {
  const filtered = filterByRange(rows, range);

  // Sentiment: group by date, count by sentiment
  const sentimentMap: Record<string, Record<string, number>> = {};
  for (const row of filtered) {
    const date = row.created_at.slice(0, 10);
    sentimentMap[date] ??= { positive: 0, neutral: 0, negative: 0, urgent: 0 };
    if (row.sentiment) {
      sentimentMap[date][row.sentiment] = (sentimentMap[date][row.sentiment] || 0) + 1;
    }
  }
  const sentiment = Object.entries(sentimentMap)
    .map(
      ([date, counts]) =>
        ({ date, ...counts }) as {
          date: string;
          positive: number;
          neutral: number;
          negative: number;
          urgent: number;
        },
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  // Topics: count by theme title
  const topicCounts: Record<string, number> = {};
  for (const row of filtered) {
    const topic = getRowTopic(row);
    if (topic) {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    }
  }
  const topics = Object.entries(topicCounts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Volume: group by date, count by category
  const volumeMap: Record<string, Record<string, number>> = {};
  for (const row of filtered) {
    const date = row.created_at.slice(0, 10);
    volumeMap[date] ??= {};
    const cat = row.category || 'other';
    volumeMap[date][cat] = (volumeMap[date][cat] || 0) + 1;
  }
  const volume = Object.entries(volumeMap)
    .map(([date, cats]) => ({ date, ...cats }))
    .sort((a, b) => (a.date as string).localeCompare(b.date as string));

  // Scores: bucket composite_score into ranges 1-2, 2-3, ..., 10-11
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    range: `${i + 1}-${i + 2}`,
    count: 0,
  }));
  for (const row of filtered) {
    if (row.composite_score != null) {
      const idx = Math.max(0, Math.min(Math.floor(row.composite_score) - 1, 9));
      buckets[idx].count++;
    }
  }

  return { sentiment, topics, volume, scores: buckets };
}
