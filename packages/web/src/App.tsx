import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Login } from '@/pages/Login';
import { Filter } from '@/pages/Filter';
import { Relationships } from '@/pages/Relationships';
import { CompanyContext } from '@/pages/CompanyContext';
import { Analytics } from '@/pages/Analytics';
import { Setup } from '@/pages/Setup';
import { Prompts } from '@/pages/Prompts';
import { PipelineMonitor } from '@/pages/PipelineMonitor';
import { SystemConfig } from '@/pages/SystemConfig';
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

        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/filter" replace />} />
          <Route path="/filter" element={<Filter />} />
          <Route path="/relationships" element={<Relationships />} />
          <Route path="/company-context" element={<CompanyContext />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/setup" element={<Setup />} />

          <Route
            path="/admin/pipeline"
            element={
              <AdminGuard>
                <PipelineMonitor />
              </AdminGuard>
            }
          />
          <Route
            path="/admin/prompts"
            element={
              <AdminGuard>
                <Prompts />
              </AdminGuard>
            }
          />
          <Route
            path="/admin/config"
            element={
              <AdminGuard>
                <SystemConfig />
              </AdminGuard>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
