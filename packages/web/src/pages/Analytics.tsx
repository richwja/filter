import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppContext } from '@/lib/types';

const SENTIMENT_COLORS = {
  positive: '#0f766e',
  neutral: '#6d5bae',
  negative: '#9f1239',
  urgent: '#dc2626',
};
const RANGES = ['7d', '30d', '90d'] as const;

export function Analytics() {
  const { session, currentProject } = useOutletContext<AppContext>();
  const [range, setRange] = useState<string>('30d');
  const [sentiment, setSentiment] = useState<Record<string, unknown>[]>([]);
  const [topics, setTopics] = useState<{ topic: string; count: number }[]>([]);
  const [volume, setVolume] = useState<Record<string, unknown>[]>([]);
  const [scores, setScores] = useState<{ range: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentProject || !session) return;
    setLoading(true);
    const base = `/api/projects/${currentProject.id}/analytics`;
    const headers = { Authorization: `Bearer ${session.access_token}` };

    Promise.all([
      fetch(`${base}/sentiment?range=${range}`, { headers }).then((r) => r.json()),
      fetch(`${base}/topics?range=${range}`, { headers }).then((r) => r.json()),
      fetch(`${base}/volume?range=${range}`, { headers }).then((r) => r.json()),
      fetch(`${base}/scores`, { headers }).then((r) => r.json()),
    ])
      .then(([s, t, v, sc]) => {
        setSentiment(s.data ?? []);
        setTopics(t.data ?? []);
        setVolume(v.data ?? []);
        setScores(sc.data ?? []);
      })
      .catch((err) => console.error('Analytics fetch error:', err))
      .finally(() => setLoading(false));
  }, [currentProject, session, range]);

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <Loader2 className="h-6 w-6 animate-spin text-surface-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-surface-950 tracking-heading">Analytics</h1>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                range === r
                  ? 'bg-pink-600/10 text-pink-500'
                  : 'text-surface-600 hover:text-surface-800',
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-300 bg-surface-50 p-5">
          <h2 className="mb-4 text-sm font-medium text-surface-600">Sentiment trend</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sentiment}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e3447" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7394' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7394' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1d27',
                  border: '1px solid #2e3447',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="positive" stackId="a" fill={SENTIMENT_COLORS.positive} />
              <Bar dataKey="neutral" stackId="a" fill={SENTIMENT_COLORS.neutral} />
              <Bar
                dataKey="negative"
                stackId="a"
                fill={SENTIMENT_COLORS.negative}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-surface-300 bg-surface-50 p-5">
          <h2 className="mb-4 text-sm font-medium text-surface-600">Top topics</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topics} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2e3447" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7394' }} />
              <YAxis
                dataKey="topic"
                type="category"
                tick={{ fontSize: 11, fill: '#6b7394' }}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1d27',
                  border: '1px solid #2e3447',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" fill="#db2777" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-surface-300 bg-surface-50 p-5">
          <h2 className="mb-4 text-sm font-medium text-surface-600">Email volume</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={volume}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e3447" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7394' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7394' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1d27',
                  border: '1px solid #2e3447',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="media_inquiry"
                stroke="#ec4899"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="interview_request"
                stroke="#0f766e"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="event_invitation"
                stroke="#6d5bae"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-surface-300 bg-surface-50 p-5">
          <h2 className="mb-4 text-sm font-medium text-surface-600">Score distribution</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={scores}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e3447" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#6b7394' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7394' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1d27',
                  border: '1px solid #2e3447',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
