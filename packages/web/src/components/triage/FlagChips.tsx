import { cn } from '@/lib/utils';

interface FlagChipsProps {
  flags: string[];
}

const flagColors: Record<string, string> = {
  'Tier 1': 'bg-pink-100 text-pink-700',
  Deadline: 'bg-red-100 text-red-700',
  VIP: 'bg-purple-100 text-purple-700',
  Sensitive: 'bg-amber-100 text-amber-700',
  'New Contact': 'bg-teal-100 text-teal-700',
  'Follow-up': 'bg-blue-100 text-blue-700',
};

function getFlagColor(flag: string): string {
  return flagColors[flag] ?? 'bg-gray-200 text-gray-500';
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
