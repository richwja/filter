import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ChevronDown, ChevronRight, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppContext } from '@/lib/types';

interface PromptVersion {
  id: string;
  prompt_type: string;
  content: string;
  version: number;
  is_active: boolean;
  created_at: string;
}

function PromptSection({
  type,
  label,
  projectId,
  token,
}: {
  type: string;
  label: string;
  projectId: string;
  token: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/prompts/${projectId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(({ prompts }) => {
        const filtered = (prompts ?? []).filter((p: PromptVersion) => p.prompt_type === type);
        setVersions(filtered);
        const active = filtered.find((p: PromptVersion) => p.is_active);
        if (active) setContent(active.content);
      });
  }, [projectId, type]);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/admin/prompts/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },

      body: JSON.stringify({ prompt_type: type, content }),
    });
    setSaving(false);
    setEditing(false);
  }

  return (
    <div className="rounded-xl border border-surface-300 bg-surface-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-5 py-4 text-left"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-surface-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-surface-500" />
        )}
        <span className="text-sm font-medium text-surface-950">{label}</span>
        <span className="ml-auto text-xs text-surface-500">v{versions[0]?.version ?? 0}</span>
      </button>

      {expanded && (
        <div className="border-t border-surface-300 p-5 space-y-3">
          {editing ? (
            <>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                className="w-full rounded-md border border-surface-300 bg-surface px-4 py-3 font-mono text-xs text-surface-800 leading-relaxed focus:border-pink-600 focus:outline-none resize-y"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-md bg-pink-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}{' '}
                  Save version
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-md border border-surface-300 px-3 py-1.5 text-sm font-medium text-surface-800 transition-colors hover:bg-surface-100"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <pre className="max-h-96 overflow-y-auto rounded-md bg-surface p-4 font-mono text-xs text-surface-700 leading-relaxed">
                {content || '(No prompt set)'}
              </pre>
              <button
                onClick={() => setEditing(true)}
                className="rounded-md border border-surface-300 px-3 py-1.5 text-sm font-medium text-surface-800 transition-colors hover:bg-surface-100"
              >
                Edit prompt
              </button>
            </>
          )}

          {versions.length > 1 && (
            <div className="mt-4 border-t border-surface-300 pt-3">
              <h4 className="mb-2 text-xs font-medium text-surface-500">Version history</h4>
              <div className="space-y-1">
                {versions.slice(0, 5).map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-xs">
                    <span
                      className={cn('text-surface-600', v.is_active && 'text-pink-500 font-medium')}
                    >
                      v{v.version} {v.is_active && '(active)'}
                    </span>
                    <span className="text-surface-500">
                      {new Date(v.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Prompts() {
  const { session, currentProject } = useOutletContext<AppContext>();

  if (!currentProject) return <p className="text-surface-600">Select a project first.</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-xl font-semibold text-surface-950 tracking-heading">
        Prompt Management
      </h1>
      <div className="space-y-4">
        <PromptSection
          type="classify"
          label="Classification Prompt (Haiku)"
          projectId={currentProject.id}
          token={session.access_token}
        />
        <PromptSection
          type="rank"
          label="Ranking Prompt (Sonnet)"
          projectId={currentProject.id}
          token={session.access_token}
        />
      </div>
    </div>
  );
}
