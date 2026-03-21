import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { Save, Plus, FileText, PenLine, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppContext } from '@/lib/types';

export function CompanyContext() {
  const { session, currentProject } = useOutletContext<AppContext>();
  const [tab, setTab] = useState('briefing');
  const [briefing, setBriefing] = useState('');
  const [saving, setSaving] = useState(false);
  const [pressReleases, setPressReleases] = useState<
    { id: string; title: string; topics: string[]; status: string; published_at: string }[]
  >([]);
  const [samples, setSamples] = useState<
    { id: string; label: string; sample_type: string; tone: string }[]
  >([]);

  useEffect(() => {
    if (!currentProject) return;

    fetch(`/api/projects/${currentProject.id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then(({ project }) => setBriefing(project?.client_context || ''));

    fetch(`/api/projects/${currentProject.id}/press-releases`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then(({ press_releases }) => setPressReleases(press_releases ?? []));

    fetch(`/api/projects/${currentProject.id}/writing-samples`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then(({ writing_samples }) => setSamples(writing_samples ?? []));
  }, [currentProject, session]);

  async function saveBriefing() {
    if (!currentProject) return;
    setSaving(true);
    await fetch(`/api/projects/${currentProject.id}/client-context`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },

      body: JSON.stringify({ client_context: briefing }),
    });
    setSaving(false);
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-surface-950 tracking-heading">
        Company Context
      </h1>

      <Tabs.Root value={tab} onValueChange={setTab}>
        <Tabs.List className="mb-4 flex gap-1">
          {[
            { value: 'briefing', label: 'Client Briefing' },
            { value: 'releases', label: 'Press Releases' },
            { value: 'samples', label: 'Writing Samples' },
          ].map((t) => (
            <Tabs.Trigger
              key={t.value}
              value={t.value}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                tab === t.value
                  ? 'bg-pink-600/10 text-pink-500'
                  : 'text-surface-600 hover:text-surface-800',
              )}
            >
              {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="briefing">
          <div className="rounded-xl border border-surface-300 bg-surface-50 p-5">
            <textarea
              value={briefing}
              onChange={(e) => setBriefing(e.target.value)}
              rows={16}
              placeholder="Describe the client's business, current media strategy, focus areas, key messages, sensitive topics, risks and opportunities. This context guides how Filter analyses and responds to every inbound email."
              className="w-full rounded-md border border-surface-300 bg-surface px-4 py-3 text-sm text-surface-900 placeholder:text-surface-500 leading-relaxed focus:border-pink-600 focus:outline-none resize-y"
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={saveBriefing}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save briefing
              </button>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="releases">
          <div className="space-y-3">
            <div className="flex justify-end">
              <button className="inline-flex items-center gap-1.5 rounded-md bg-pink-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-pink-700">
                <Plus className="h-4 w-4" /> Add press release
              </button>
            </div>
            {pressReleases.length === 0 ? (
              <div className="rounded-xl border border-surface-300 bg-surface-50 p-8 text-center text-sm text-surface-600">
                No press releases yet. Add your client's recent announcements.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {pressReleases.map((pr) => (
                  <div
                    key={pr.id}
                    className="rounded-xl border border-surface-300 bg-surface-50 p-4"
                  >
                    <div className="flex items-start gap-2">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-surface-500" />
                      <div>
                        <h3 className="text-sm font-medium text-surface-950">{pr.title}</h3>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {pr.topics?.map((t) => (
                            <span
                              key={t}
                              className="rounded bg-surface-200 px-1.5 py-0.5 text-[10px] text-surface-600"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-surface-500">
                          {pr.status} ·{' '}
                          {pr.published_at
                            ? new Date(pr.published_at).toLocaleDateString()
                            : 'No date'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Tabs.Content>

        <Tabs.Content value="samples">
          <div className="space-y-3">
            <div className="flex justify-end">
              <button className="inline-flex items-center gap-1.5 rounded-md bg-pink-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-pink-700">
                <Plus className="h-4 w-4" /> Add sample
              </button>
            </div>
            {samples.length === 0 ? (
              <div className="rounded-xl border border-surface-300 bg-surface-50 p-8 text-center text-sm text-surface-600">
                No writing samples yet. Add examples of your client's communication style.
              </div>
            ) : (
              samples.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border border-surface-300 bg-surface-50 p-4"
                >
                  <PenLine className="h-4 w-4 shrink-0 text-surface-500" />
                  <div>
                    <span className="text-sm font-medium text-surface-950">
                      {s.label || 'Untitled'}
                    </span>
                    <span className="ml-2 text-xs text-surface-500">
                      {s.sample_type?.replace(/_/g, ' ')} · {s.tone}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
