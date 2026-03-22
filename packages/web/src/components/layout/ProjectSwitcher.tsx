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
        <button className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
          {currentProject.name}
          <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[200px] rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
        >
          {projects.map((project) => (
            <DropdownMenu.Item
              key={project.id}
              onSelect={() => onSwitch(project.id)}
              className={cn(
                'flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm outline-none hover:bg-gray-50',
                project.id === currentProject.id ? 'text-pink-600' : 'text-gray-700',
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
