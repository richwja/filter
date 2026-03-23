import { useState, useCallback } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2, LogOut, Plus } from 'lucide-react';
import { TopNav } from './TopNav';
import { SetupWizard } from '@/components/onboarding/SetupWizard';
import { useAuth } from '@/hooks/useAuth';
import { useProject } from '@/hooks/useProject';

export function AppShell() {
  const { user, session, loading: authLoading, signOut } = useAuth();
  const {
    projects,
    currentProject,
    switchProject,
    loading: projectsLoading,
    createProject,
  } = useProject(session);
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

  if (projects.length === 0 && session) {
    return (
      <NewProjectScreen
        token={session.access_token}
        onCreated={createProject}
        onSignOut={signOut}
      />
    );
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

function NewProjectScreen({
  token,
  onCreated,
  onSignOut,
}: {
  token: string;
  onCreated: (name: string, token: string) => Promise<void>;
  onSignOut: () => void;
}) {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    await onCreated(name.trim(), token);
    setCreating(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-gray-900 tracking-heading">Filter</h1>
          <p className="mt-2 text-sm text-gray-500">Create your first project to get started.</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Project name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Joby Aviation"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-pink-600 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                Each project is a separate press inbox for one client.
              </p>
            </div>
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-pink-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create project
            </button>
          </form>
        </div>

        <button
          onClick={onSignOut}
          className="mt-4 flex w-full items-center justify-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-gray-700"
        >
          <LogOut className="h-3 w-3" />
          Sign out
        </button>
      </div>
    </div>
  );
}
