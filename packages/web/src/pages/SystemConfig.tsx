import { useState, useEffect } from 'react';
import { Loader2, Shield, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  created_at: string;
}

export function SystemConfig() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Admin endpoint — would need to be added for production
    setUsers([]);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <Loader2 className="h-6 w-6 animate-spin text-surface-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-xl font-semibold text-surface-950 tracking-heading">
        System Configuration
      </h1>

      <section className="rounded-xl border border-surface-300 bg-surface-50">
        <div className="border-b border-surface-300 px-5 py-3">
          <h2 className="text-sm font-medium text-surface-800">Team Management</h2>
        </div>

        {users.length === 0 ? (
          <div className="p-8 text-center text-sm text-surface-600">
            No users to display. User management will be available once the system is connected to
            Supabase.
          </div>
        ) : (
          <div className="divide-y divide-surface-300/50">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-200">
                    {u.role === 'admin' ? (
                      <Shield className="h-4 w-4 text-pink-500" />
                    ) : (
                      <User className="h-4 w-4 text-surface-600" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-surface-950">{u.name || u.email}</div>
                    <div className="text-xs text-surface-500">{u.email}</div>
                  </div>
                </div>
                <span
                  className={cn(
                    'rounded px-2 py-0.5 text-xs font-medium',
                    u.role === 'admin'
                      ? 'bg-pink-600/15 text-pink-400'
                      : 'bg-surface-200 text-surface-600',
                  )}
                >
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
