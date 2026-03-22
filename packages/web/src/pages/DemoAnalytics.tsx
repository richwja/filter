import { useState, useMemo } from 'react';
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
import { cn } from '@/lib/utils';
import { generateDemoData, computeDemoAnalytics } from '@/lib/demo';

const SENTIMENT_COLORS = {
  positive: '#0f766e',
  neutral: '#6d5bae',
  negative: '#9f1239',
  urgent: '#dc2626',
};
const RANGES = ['7d', '30d', '90d'] as const;

function formatDateTick(dateStr: string, range: string): string {
  const d = new Date(dateStr);
  if (range === '7d') return d.toLocaleDateString(undefined, { weekday: 'short' });
  if (range === '30d') return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return d.toLocaleDateString(undefined, { month: 'short' });
}

export function DemoAnalytics() {
  const [range, setRange] = useState<string>('30d');
  const { triage } = useMemo(() => generateDemoData(), []);
  const { sentiment, topics, volume, scores } = useMemo(
    () => computeDemoAnalytics(triage, range),
    [triage, range],
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 tracking-heading">Analytics</h1>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                range === r ? 'bg-pink-50 text-pink-600' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-medium text-gray-500">Sentiment Trends</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sentiment}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => formatDateTick(v, range)}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                {...(range !== '7d' ? { angle: -45, textAnchor: 'end' } : {})}
              />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
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

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-medium text-gray-500">Inbound Themes</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topics} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis
                dataKey="topic"
                type="category"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" fill="#db2777" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-medium text-gray-500">Inbound Volume</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={volume}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => formatDateTick(v, range)}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                {...(range !== '7d' ? { angle: -45, textAnchor: 'end' } : {})}
              />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
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

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-medium text-gray-500">Priority Scores</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={scores}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
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
