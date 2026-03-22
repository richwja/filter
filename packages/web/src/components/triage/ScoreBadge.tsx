import { cn } from '@/lib/utils';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md';
}

export function ScoreBadge({ score, size = 'sm' }: ScoreBadgeProps) {
  const colorClass =
    score >= 8
      ? 'bg-red-100 text-red-700'
      : score >= 6
        ? 'bg-amber-100 text-amber-700'
        : score >= 4
          ? 'bg-blue-100 text-blue-700'
          : 'bg-gray-100 text-gray-500';

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
