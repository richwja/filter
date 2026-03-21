import { cn } from '@/lib/utils';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md';
}

export function ScoreBadge({ score, size = 'sm' }: ScoreBadgeProps) {
  const colorClass =
    score >= 8
      ? 'bg-red-500/15 text-red-400'
      : score >= 6
        ? 'bg-amber-500/15 text-amber-400'
        : score >= 4
          ? 'bg-blue-500/15 text-blue-400'
          : 'bg-surface-300/40 text-surface-600';

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium',
        size === 'sm' ? 'h-6 w-6 text-xs' : 'h-8 w-8 text-sm',
        colorClass,
      )}
    >
      {score}
    </span>
  );
}
