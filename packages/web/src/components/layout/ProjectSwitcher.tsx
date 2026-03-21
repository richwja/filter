import { ChevronDown, Check } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';
import type { Project } from '@/hooks/useProject';

interface ProjectSwitcherProps {
  projects: Project[];
  currentProject: Project | null;
  onSwitch: (id: string) => void;
}

export function ProjectSwitcher({ projects, currentProject, onSwitch }: ProjectSwitcherProps) {
  if (!currentProject) return null;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-1.5 rounded-md border border-surface-300 bg-surface px-3 py-1.5 text-sm font-medium text-surface-800 transition-colors hover:bg-surface-100">
          {currentProject.name}
          <ChevronDown className="h-3.5 w-3.5 text-surface-600" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[200px] rounded-xl border border-surface-300 bg-surface-50 p-1 shadow-lg"
        >
          {projects.map((project) => (
            <DropdownMenu.Item
              key={project.id}
              onSelect={() => onSwitch(project.id)}
              className={cn(
                'flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm outline-none hover:bg-surface-100',
                project.id === currentProject.id ? 'text-pink-500' : 'text-surface-800',
              )}
            >
              {project.name}
              {project.id === currentProject.id && <Check className="h-4 w-4" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
