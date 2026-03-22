import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';
import { TriageTable } from './TriageTable';
import type { DemoStory } from '@/lib/demo';
import type { TriageRow } from '@/hooks/useTriageRealtime';

interface TeamMember {
  id: string;
  name: string;
}

interface StoriesViewProps {
  stories: DemoStory[];
  allRows: TriageRow[];
  teamMembers: TeamMember[];
  onRowClick: (row: TriageRow) => void;
  onAssignOwner: (storyId: string, userId: string | null) => void;
}

const priorityColor: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-gray-400',
};

export function StoriesView({
  stories,
  allRows,
  teamMembers,
  onRowClick,
  onAssignOwner,
}: StoriesViewProps) {
  const { uncategorised } = useMemo(() => {
    const ids = new Set(stories.flatMap((s) => s.triage_ids));
    return { uncategorised: allRows.filter((r) => !ids.has(r.id)) };
  }, [stories, allRows]);

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set(stories.map((s) => s.id));
    return initial;
  });

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {stories.map((story) => {
        const isOpen = expanded.has(story.id);
        const storyRows = story.triage_ids
          .map((tid) => allRows.find((r) => r.id === tid))
          .filter(Boolean) as TriageRow[];

        return (
          <div key={story.id} className="rounded-xl border border-gray-200 bg-white">
            <button
              onClick={() => toggleExpanded(story.id)}
              className="flex w-full items-start gap-3 px-5 py-4 text-left"
            >
              {isOpen ? (
                <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              ) : (
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', priorityColor[story.priority])} />
                  <h3 className="text-sm font-semibold text-gray-900 tracking-heading">
                    {story.title}
                  </h3>
                </div>
                <p className="mt-1 text-sm text-gray-500">{story.summary}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                  <span>{storyRows.length} items</span>
                  <span>·</span>
                  <OwnerBadge story={story} teamMembers={teamMembers} onAssign={onAssignOwner} />
                </div>
              </div>
            </button>
            {isOpen && storyRows.length > 0 && (
              <div className="border-t border-gray-100 px-5 pb-4 pt-2">
                <TriageTable data={storyRows} onRowClick={onRowClick} />
              </div>
            )}
          </div>
        );
      })}

      {uncategorised.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white">
          <button
            onClick={() => toggleExpanded('_uncategorised')}
            className="flex w-full items-start gap-3 px-5 py-4 text-left"
          >
            {expanded.has('_uncategorised') ? (
              <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            ) : (
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Uncategorised</h3>
              <p className="mt-1 text-xs text-gray-400">
                {uncategorised.length} items not assigned to a story
              </p>
            </div>
          </button>
          {expanded.has('_uncategorised') && (
            <div className="border-t border-gray-100 px-5 pb-4 pt-2">
              <TriageTable data={uncategorised} onRowClick={onRowClick} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OwnerBadge({
  story,
  teamMembers,
  onAssign,
}: {
  story: DemoStory;
  teamMembers: TeamMember[];
  onAssign: (storyId: string, userId: string | null) => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-gray-600 transition-colors hover:bg-gray-100"
        >
          Owner: {story.owner_name || 'Unassigned'}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={4}
          className="z-50 min-w-[160px] rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu.Item
            onSelect={() => onAssign(story.id, null)}
            className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-gray-700 outline-none hover:bg-gray-50"
          >
            Unassigned
          </DropdownMenu.Item>
          {teamMembers.map((m) => (
            <DropdownMenu.Item
              key={m.id}
              onSelect={() => onAssign(story.id, m.id)}
              className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-gray-700 outline-none hover:bg-gray-50"
            >
              {m.name}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
