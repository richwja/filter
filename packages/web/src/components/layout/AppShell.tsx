import { useState, useCallback } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { TopNav } from './TopNav';
import { SetupWizard } from '@/components/onboarding/SetupWizard';
import { useAuth } from '@/hooks/useAuth';
import { useProject } from '@/hooks/useProject';

export function AppShell() {
  const { user, session, loading: authLoading, signOut } = useAuth();
  const { projects, currentProject, switchProject, loading: projectsLoading } = useProject(session);
  const [wizardDismissed, setWizardDismissed] = useState(false);

  const handleActivated = useCallback(() => {
    setWizardDismissed(true);
    window.location.reload();
  }, []);

  if (authLoading || projectsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const showWizard = !wizardDismissed && currentProject?.status === 'setup';

  return (
    <div className="min-h-screen bg-gray-100">
      <TopNav
        user={user}
        projects={projects}
        currentProject={currentProject}
        onSwitchProject={switchProject}
        onSignOut={signOut}
      />
      <main className="pt-14">
        <div className="p-6">
          <Outlet context={{ user, session, currentProject }} />
        </div>
      </main>
      {showWizard && session && (
        <SetupWizard
          project={currentProject}
          token={session.access_token}
          onActivated={handleActivated}
        />
      )}
    </div>
  );
}
