import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import { DEMO_USER, DEMO_PROJECT } from '@/lib/demo';

const DEMO_SESSION = { access_token: 'demo' } as never;

export function DemoShell() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="fixed top-14 left-0 right-0 z-40 bg-pink-600 px-4 py-1 text-center text-xs font-medium text-white">
        Demo mode — viewing with mock data
      </div>
      <TopNav
        user={DEMO_USER}
        projects={[DEMO_PROJECT]}
        currentProject={DEMO_PROJECT}
        onSwitchProject={() => {}}
        onSignOut={() => {
          window.location.href = '/login';
        }}
        basePath="/demo"
      />
      <main className="pt-20">
        <div className="p-6">
          <Outlet
            context={{ user: DEMO_USER, session: DEMO_SESSION, currentProject: DEMO_PROJECT }}
          />
        </div>
      </main>
    </div>
  );
}
