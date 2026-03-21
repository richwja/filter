import { cn } from '@/lib/utils';

interface FlagChipsProps {
  flags: string[];
}

const flagColors: Record<string, string> = {
  'Tier 1': 'bg-pink-600/15 text-pink-400',
  Deadline: 'bg-red-500/15 text-red-400',
  VIP: 'bg-purple-500/15 text-purple-400',
  Sensitive: 'bg-amber-500/15 text-amber-400',
  'New Contact': 'bg-teal-500/15 text-teal-400',
  'Follow-up': 'bg-blue-500/15 text-blue-400',
};

function getFlagColor(flag: string): string {
  return flagColors[flag] ?? 'bg-surface-300/40 text-surface-600';
}

export function FlagChips({ flags }: FlagChipsProps) {
  if (!flags.length) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {flags.map((flag) => (
        <span
          key={flag}
          className={cn(
            'inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium',
            getFlagColor(flag),
          )}
        >
          {flag}
        </span>
      ))}
    </div>
  );
}
