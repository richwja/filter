import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { TopNav } from './TopNav';
import { useAuth } from '@/hooks/useAuth';
import { useProject } from '@/hooks/useProject';

export function AppShell() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { projects, currentProject, switchProject, loading: projectsLoading } = useProject();

  if (authLoading || projectsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Loader2 className="h-6 w-6 animate-spin text-surface-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-surface">
      <TopNav
        user={user}
        projects={projects}
        currentProject={currentProject}
        onSwitchProject={switchProject}
        onSignOut={signOut}
      />
      <main className="pt-14">
        <div className="p-6">
          <Outlet context={{ user, currentProject }} />
        </div>
      </main>
    </div>
  );
}
