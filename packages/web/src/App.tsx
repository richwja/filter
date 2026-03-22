import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { DemoShell } from '@/components/layout/DemoShell';
import { Login } from '@/pages/Login';
import { Filter } from '@/pages/Filter';
import { DemoFilter } from '@/pages/DemoFilter';
import { Relationships } from '@/pages/Relationships';
import { Analytics } from '@/pages/Analytics';
import { Settings } from '@/pages/Settings';
import { SettingsGeneral } from '@/pages/settings/SettingsGeneral';
import { SettingsContext } from '@/pages/settings/SettingsContext';
import { SettingsTeam } from '@/pages/settings/SettingsTeam';
import { SettingsPrompts } from '@/pages/settings/SettingsPrompts';
import type { AppContext } from '@/lib/types';

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user } = useOutletContext<AppContext>();
  if (user.role !== 'admin') return <Navigate to="/filter" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Demo routes — no auth required */}
        <Route path="/demo" element={<DemoShell />}>
          <Route index element={<Navigate to="/demo/filter" replace />} />
          <Route path="filter" element={<DemoFilter />} />
          <Route path="relationships" element={<Relationships />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings basePath="/demo" />}>
            <Route index element={<Navigate to="/demo/settings/general" replace />} />
            <Route path="general" element={<SettingsGeneral />} />
            <Route path="context" element={<SettingsContext />} />
            <Route path="team" element={<SettingsTeam />} />
            <Route path="prompts" element={<SettingsPrompts />} />
          </Route>
        </Route>

        {/* Authenticated routes */}
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/filter" replace />} />
          <Route path="/filter" element={<Filter />} />
          <Route path="/relationships" element={<Relationships />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />}>
            <Route index element={<Navigate to="/settings/general" replace />} />
            <Route path="general" element={<SettingsGeneral />} />
            <Route path="context" element={<SettingsContext />} />
            <Route path="team" element={<SettingsTeam />} />
            <Route
              path="prompts"
              element={
                <AdminGuard>
                  <SettingsPrompts />
                </AdminGuard>
              }
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
