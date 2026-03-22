import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
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
  description,
  projectId,
  token,
}: {
  type: string;
  label: string;
  description?: string;
  projectId: string;
  token: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/prompts/${projectId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(({ prompts }) => {
        const filtered = (prompts ?? []).filter((p: PromptVersion) => p.prompt_type === type);
        setVersions(filtered);
        const active = filtered.find((p: PromptVersion) => p.is_active);
        if (active) setContent(active.content);
      });
  }, [projectId, type, token]);

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
    <div className="rounded-xl border border-gray-200 bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-5 py-4 text-left"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
        <span>
          <span className="text-sm font-medium text-gray-900">{label}</span>
          {description && <span className="block text-xs text-gray-500 mt-0.5">{description}</span>}
        </span>
        {versions.length > 0 && (
          <span className="ml-auto text-xs text-gray-500">v{versions[0].version}</span>
        )}
      </button>

      {expanded && (
        <div className="border-t border-gray-200 p-5 space-y-3">
          {editing ? (
            <>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 font-mono text-xs text-gray-700 leading-relaxed focus:border-pink-600 focus:outline-none resize-y"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-md bg-pink-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <pre className="max-h-96 overflow-y-auto rounded-md bg-gray-50 p-4 font-mono text-xs text-gray-700 leading-relaxed">
                {content || '(No prompt set)'}
              </pre>
              <button
                onClick={() => setEditing(true)}
                className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Edit prompt
              </button>
            </>
          )}

          {versions.length > 0 && (
            <div className="mt-4 border-t border-gray-200 pt-3">
              <h4 className="mb-2 text-xs font-medium text-gray-500">Version history</h4>
              <div className="space-y-1">
                {versions.slice(0, 5).map((v) => (
                  <div key={v.id}>
                    {v.is_active ? (
                      <div className="flex w-full items-center justify-between text-xs py-1">
                        <span className="text-pink-600 font-medium">v{v.version} (active)</span>
                        <span className="text-gray-500">
                          {new Date(v.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setExpandedVersion(expandedVersion === v.id ? null : v.id)}
                        className="flex w-full items-center justify-between text-xs py-1"
                      >
                        <span className="flex items-center gap-1">
                          {expandedVersion === v.id ? (
                            <ChevronDown className="h-3 w-3 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-gray-400" />
                          )}
                          <span className="text-gray-500">v{v.version}</span>
                        </span>
                        <span className="text-gray-500">
                          {new Date(v.created_at).toLocaleDateString()}
                        </span>
                      </button>
                    )}
                    {expandedVersion === v.id && !v.is_active && (
                      <div className="ml-4 mt-1 mb-2">
                        <pre className="max-h-48 overflow-y-auto rounded-md bg-gray-50 p-3 font-mono text-xs text-gray-700 leading-relaxed border border-gray-200">
                          {v.content}
                        </pre>
                        <button
                          onClick={() => {
                            setContent(v.content);
                            setEditing(true);
                            setExpandedVersion(null);
                          }}
                          className="mt-2 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          Restore this version
                        </button>
                      </div>
                    )}
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

export function SettingsPrompts() {
  const { session, currentProject } = useOutletContext<AppContext>();

  if (!currentProject || !session) return <p className="text-gray-500">Select a project first.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900 tracking-heading">Prompts</h1>
      <div className="space-y-4">
        <PromptSection
          type="classify"
          label="Classification Master Prompt"
          description="Set how the application classifies inbound enquiries"
          projectId={currentProject.id}
          token={session.access_token}
        />
        <PromptSection
          type="rank"
          label="Ranking Master Prompt"
          description="Set how the application ranks inbound enquiries"
          projectId={currentProject.id}
          token={session.access_token}
        />
      </div>
    </div>
  );
}
