import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { X, Plus } from 'lucide-react';
import { SettingsSection } from '@/components/settings/SettingsSection';
import type { AppContext } from '@/lib/types';

const DEFAULT_CATEGORIES = [
  'media_inquiry',
  'interview_request',
  'press_release_pitch',
  'event_invitation',
  'partnership_inquiry',
  'pr_agency_pitch',
  'other',
];

export function SettingsCategories() {
  const { session, currentProject } = useOutletContext<AppContext>();
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [newCategory, setNewCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [projectConfig, setProjectConfig] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!currentProject || !session) {
      setCategories(DEFAULT_CATEGORIES);
      setProjectConfig({});
      return;
    }

    fetch(`/api/projects/${currentProject.id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then(({ project }) => {
        const cfg = project?.config ?? {};
        setProjectConfig(cfg);
        if (Array.isArray(cfg.categories) && cfg.categories.length > 0) {
          setCategories(cfg.categories as string[]);
        }
      })
      .catch(() => {});
  }, [currentProject, session]);

  async function saveCategories(updated: string[]) {
    if (!currentProject) return;
    setSaving(true);
    const newConfig = { ...projectConfig, categories: updated };
    setProjectConfig(newConfig);
    await fetch(`/api/projects/${currentProject.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ config: newConfig }),
    }).catch((err) => console.error('Failed to save categories:', err));
    setSaving(false);
  }

  function handleAdd() {
    const slug = newCategory.trim().toLowerCase().replace(/\s+/g, '_');
    if (!slug || categories.includes(slug)) return;
    const updated = [...categories, slug];
    setCategories(updated);
    setNewCategory('');
    saveCategories(updated);
  }

  function handleRemove(cat: string) {
    const updated = categories.filter((c) => c !== cat);
    setCategories(updated);
    saveCategories(updated);
  }

  if (!currentProject) {
    return <p className="text-gray-500">Select a project first.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900 tracking-heading">Categories</h1>

      <SettingsSection
        title="Email Categories"
        description="Categories used to classify inbound emails. Changes apply to new emails only."
      >
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-sm text-gray-700"
            >
              {cat.replace(/_/g, ' ')}
              <button
                onClick={() => handleRemove(cat)}
                className="ml-0.5 rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="New category name"
            className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-500 focus:border-pink-600 focus:outline-none"
          />
          <button
            onClick={handleAdd}
            disabled={saving || !newCategory.trim()}
            className="inline-flex items-center gap-1.5 rounded-md bg-pink-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </SettingsSection>
    </div>
  );
}
