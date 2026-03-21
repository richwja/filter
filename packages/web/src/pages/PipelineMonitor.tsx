import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Project } from '@/hooks/useProject';
import type { UserProfile } from '@/hooks/useAuth';

interface PipelineLog {
  id: string;
  email_id: string;
  step: string;
  status: string;
  duration_ms: number | null;
  error_message: string | null;
  created_at: string;
  emails?: { subject: string; from_address: string } | null;
}

const STEPS = ['classify', 'enrich', 'rank'];
const stepColors: Record<string, string> = {
  completed: 'bg-green-500',
  started: 'bg-yellow-500 animate-pulse',
  failed: 'bg-red-500',
};

export function PipelineMonitor() {
  const { currentProject } = useOutletContext<{
    user: UserProfile;
    currentProject: Project | null;
  }>();
  const [logs, setLogs] = useState<PipelineLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(() => {
    const params = currentProject ? `?project_id=${currentProject.id}` : '';
    fetch(`/api/admin/pipeline${params}`)
      .then((r) => r.json())
      .then(({ logs: l }) => setLogs(l ?? []))
      .finally(() => setLoading(false));
  }, [currentProject]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Group logs by email_id
  const byEmail = new Map<string, PipelineLog[]>();
  for (const log of logs) {
    const existing = byEmail.get(log.email_id) ?? [];
    existing.push(log);
    byEmail.set(log.email_id, existing);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <Loader2 className="h-6 w-6 animate-spin text-surface-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-surface-950 tracking-heading">
          Pipeline Monitor
        </h1>
        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-1.5 rounded-md border border-surface-300 px-3 py-1.5 text-sm font-medium text-surface-800 transition-colors hover:bg-surface-100"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-300">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-300 bg-surface-100">
              <th className="px-3 py-2.5 text-left text-xs font-medium text-surface-600">Email</th>
              {STEPS.map((s) => (
                <th
                  key={s}
                  className="px-3 py-2.5 text-center text-xs font-medium text-surface-600"
                >
                  {s}
                </th>
              ))}
              <th className="px-3 py-2.5 text-right text-xs font-medium text-surface-600">Total</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-surface-600">Error</th>
            </tr>
          </thead>
          <tbody>
            {[...byEmail.entries()].slice(0, 50).map(([emailId, emailLogs]) => {
              const hasError = emailLogs.some((l) => l.status === 'failed');
              const totalMs = emailLogs.reduce((sum, l) => sum + (l.duration_ms ?? 0), 0);
              const firstLog = emailLogs[0];

              return (
                <tr
                  key={emailId}
                  className={cn('border-b border-surface-300/50', hasError && 'bg-red-500/5')}
                >
                  <td className="px-3 py-2.5">
                    <div className="text-sm text-surface-900 truncate max-w-[200px]">
                      {firstLog.emails?.subject || emailId.slice(0, 8)}
                    </div>
                    <div className="text-xs text-surface-500">{firstLog.emails?.from_address}</div>
                  </td>
                  {STEPS.map((step) => {
                    const log = emailLogs.find((l) => l.step === step);
                    return (
                      <td key={step} className="px-3 py-2.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className={cn(
                              'h-2.5 w-2.5 rounded-full',
                              log ? stepColors[log.status] || 'bg-surface-400' : 'bg-surface-300',
                            )}
                          />
                          {log?.duration_ms != null && (
                            <span className="text-[10px] text-surface-500">
                              {log.duration_ms}ms
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2.5 text-right text-xs text-surface-500">{totalMs}ms</td>
                  <td className="px-3 py-2.5">
                    {hasError && (
                      <div className="flex items-center gap-1 text-xs text-red-400">
                        <AlertCircle className="h-3 w-3" />
                        <span className="truncate max-w-[150px]">
                          {emailLogs.find((l) => l.status === 'failed')?.error_message}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
