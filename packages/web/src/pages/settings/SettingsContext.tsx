import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, FileText, PenLine, Loader2 } from 'lucide-react';
import { SettingsSection } from '@/components/settings/SettingsSection';
import type { AppContext } from '@/lib/types';

export function SettingsContext() {
  const { session, currentProject } = useOutletContext<AppContext>();
  const [briefing, setBriefing] = useState('');
  const [saving, setSaving] = useState(false);
  const [pressReleases, setPressReleases] = useState<
    { id: string; title: string; topics: string[]; status: string; published_at: string }[]
  >([]);
  const [samples, setSamples] = useState<
    { id: string; label: string; sample_type: string; tone: string }[]
  >([]);

  useEffect(() => {
    if (!currentProject || !session) {
      setBriefing('');
      setPressReleases([]);
      setSamples([]);
      return;
    }

    const headers = { Authorization: `Bearer ${session.access_token}` };

    fetch(`/api/projects/${currentProject.id}`, { headers })
      .then((r) => r.json())
      .then(({ project }) => setBriefing(project?.client_context || ''))
      .catch(() => setBriefing(''));

    fetch(`/api/projects/${currentProject.id}/content/press-releases`, { headers })
      .then((r) => r.json())
      .then(({ press_releases }) => setPressReleases(press_releases ?? []))
      .catch(() => setPressReleases([]));

    fetch(`/api/projects/${currentProject.id}/content/writing-samples`, { headers })
      .then((r) => r.json())
      .then(({ writing_samples }) => setSamples(writing_samples ?? []))
      .catch(() => setSamples([]));
  }, [currentProject, session]);

  async function saveBriefing() {
    if (!currentProject) return;
    setSaving(true);
    await fetch(`/api/projects/${currentProject.id}/content/client-context`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ client_context: briefing }),
    });
    setSaving(false);
  }

  if (!currentProject) {
    return <p className="text-gray-500">Select a project first.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900 tracking-heading">Context</h1>

      <SettingsSection
        title="Client Briefing"
        description="Strategic context that guides how Filter analyses and responds to every inbound email."
      >
        <textarea
          value={briefing}
          onChange={(e) => setBriefing(e.target.value)}
          rows={12}
          placeholder="Describe the client's business, current media strategy, focus areas, key messages, sensitive topics, risks and opportunities."
          className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 leading-relaxed focus:border-pink-600 focus:outline-none resize-y"
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={saveBriefing}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </button>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Press Releases"
        description="Recent announcements that help Filter understand your client's news cycle."
      >
        <div className="space-y-3">
          <div className="flex justify-end">
            <button className="inline-flex items-center gap-1.5 rounded-md bg-pink-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-pink-700">
              <Plus className="h-4 w-4" /> Add press release
            </button>
          </div>
          {pressReleases.length === 0 ? (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
              No press releases yet. Add your client's recent announcements.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {pressReleases.map((pr) => (
                <div key={pr.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{pr.title}</h3>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {pr.topics?.map((t) => (
                          <span
                            key={t}
                            className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
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
      </SettingsSection>

      <SettingsSection
        title="Writing Samples"
        description="Examples of your client's communication style for draft reply tone matching."
      >
        <div className="space-y-3">
          <div className="flex justify-end">
            <button className="inline-flex items-center gap-1.5 rounded-md bg-pink-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-pink-700">
              <Plus className="h-4 w-4" /> Add sample
            </button>
          </div>
          {samples.length === 0 ? (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
              No writing samples yet. Add examples of your client's communication style.
            </div>
          ) : (
            samples.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <PenLine className="h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <span className="text-sm font-medium text-gray-900">{s.label || 'Untitled'}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {s.sample_type?.replace(/_/g, ' ')} · {s.tone}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </SettingsSection>
    </div>
  );
}
