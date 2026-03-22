import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SettingsSidebarProps {
  isAdmin: boolean;
  basePath?: string;
}

export function SettingsSidebar({ isAdmin, basePath = '' }: SettingsSidebarProps) {
  const base = basePath ? `${basePath}/settings` : '/settings';

  const projectLinks = [
    { to: `${base}/general`, label: 'General' },
    { to: `${base}/context`, label: 'Context' },
    { to: `${base}/team`, label: 'Team' },
  ];

  const adminLinks = [{ to: `${base}/prompts`, label: 'Prompts' }];

  return (
    <nav className="w-[220px] shrink-0 sticky top-20 self-start">
      <div className="space-y-4">
        <div>
          <h3 className="mb-1 px-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
            Project
          </h3>
          <div className="space-y-0.5">
            {projectLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end
                className={({ isActive }) =>
                  cn(
                    'block rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive ? 'bg-pink-50 text-pink-600' : 'text-gray-500 hover:text-gray-900',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>

        {isAdmin && (
          <div>
            <h3 className="mb-1 px-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              Admin
            </h3>
            <div className="space-y-0.5">
              {adminLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end
                  className={({ isActive }) =>
                    cn(
                      'block rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      isActive ? 'bg-pink-50 text-pink-600' : 'text-gray-500 hover:text-gray-900',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
