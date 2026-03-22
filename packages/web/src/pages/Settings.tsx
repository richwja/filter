import { Outlet, useOutletContext, Navigate, useLocation } from 'react-router-dom';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import type { AppContext } from '@/lib/types';

interface SettingsProps {
  basePath?: string;
}

export function Settings({ basePath = '' }: SettingsProps) {
  const context = useOutletContext<AppContext>();
  const location = useLocation();
  const base = basePath ? `${basePath}/settings` : '/settings';

  // Redirect /settings → /settings/general
  if (location.pathname === base || location.pathname === `${base}/`) {
    return <Navigate to={`${base}/general`} replace />;
  }

  return (
    <div className="flex gap-8">
      <SettingsSidebar isAdmin={context.user.role === 'admin'} basePath={basePath} />
      <div className="min-w-0 flex-1">
        <Outlet context={context} />
      </div>
    </div>
  );
}
