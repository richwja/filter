import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';
import { ProjectSwitcher } from './ProjectSwitcher';
import type { UserProfile } from '@/hooks/useAuth';
import type { Project } from '@/hooks/useProject';

interface TopNavProps {
  user: UserProfile;
  projects: Project[];
  currentProject: Project | null;
  onSwitchProject: (id: string) => void;
  onSignOut: () => void;
  basePath?: string;
}

function buildNav(base: string) {
  return [
    { to: `${base}/filter`, label: 'Filter Inbox' },
    { to: `${base}/relationships`, label: 'Relationships' },
    { to: `${base}/analytics`, label: 'Analytics' },
    { to: `${base}/settings`, label: 'Settings' },
  ];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function TopNav({
  user,
  projects,
  currentProject,
  onSwitchProject,
  onSignOut,
  basePath = '',
}: TopNavProps) {
  const allItems = buildNav(basePath);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center border-b border-gray-200 bg-white px-4">
      {/* Left: Logo */}
      <div className="flex items-center gap-2 mr-8">
        <span className="text-xl font-semibold text-gray-900 tracking-heading">Filter</span>
      </div>

      {/* Center: Nav tabs */}
      <nav className="flex items-center gap-1 overflow-x-auto">
        {allItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                isActive ? 'text-pink-600' : 'text-gray-500 hover:text-gray-700',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Right: Project switcher + user menu */}
      <div className="ml-auto flex items-center gap-3">
        <ProjectSwitcher
          projects={projects}
          currentProject={currentProject}
          onSwitch={onSwitchProject}
        />

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-xs font-medium text-pink-600 transition-colors hover:bg-pink-200">
              {getInitials(user.name || user.email)}
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-[160px] rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
            >
              <div className="px-3 py-2 text-xs text-gray-500">{user.email}</div>
              <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />
              <DropdownMenu.Item
                onSelect={onSignOut}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 outline-none hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
