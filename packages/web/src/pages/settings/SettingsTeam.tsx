import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Loader2, Shield, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsSection } from '@/components/settings/SettingsSection';
import type { AppContext } from '@/lib/types';

interface Member {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  created_at: string;
}

export function SettingsTeam() {
  const { session, currentProject } = useOutletContext<AppContext>();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentProject || !session) {
      setMembers([]);
      setLoading(false);
      return;
    }

    fetch(`/api/projects/${currentProject.id}/members`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then(({ members: m }) => setMembers(m ?? []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [currentProject, session]);

  if (!currentProject) {
    return <p className="text-gray-500">Select a project first.</p>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900 tracking-heading">Team</h1>

      <SettingsSection title="Team Members" description="People with access to this project.">
        {members.length === 0 ? (
          <p className="text-sm text-gray-500">
            No team members to display. Members will appear once the project is connected.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                    {m.role === 'admin' ? (
                      <Shield className="h-4 w-4 text-pink-600" />
                    ) : (
                      <User className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{m.name || m.email}</div>
                    <div className="text-xs text-gray-500">{m.email}</div>
                  </div>
                </div>
                <span
                  className={cn(
                    'rounded px-2 py-0.5 text-xs font-medium',
                    m.role === 'admin' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-500',
                  )}
                >
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </SettingsSection>
    </div>
  );
}
