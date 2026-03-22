import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Save, Loader2 } from 'lucide-react';
import { SettingsSection } from '@/components/settings/SettingsSection';
import type { AppContext } from '@/lib/types';

export function SettingsGeneral() {
  const { session, currentProject } = useOutletContext<AppContext>();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [slackChannel, setSlackChannel] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentProject) return;
    setName(currentProject.name || '');
    setAddress(currentProject.receiving_address || '');
    setSlackChannel(currentProject.slack_channel_id || '');
  }, [currentProject]);

  async function handleSave() {
    if (!currentProject || !session) return;
    setSaving(true);
    await fetch(`/api/projects/${currentProject.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        name,
        receiving_address: address,
        slack_channel_id: slackChannel,
      }),
    }).catch((err) => console.error('Failed to save:', err));
    setSaving(false);
  }

  if (!currentProject) {
    return <p className="text-gray-500">Select a project first.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900 tracking-heading">General</h1>

      <SettingsSection title="Project Details" description="Basic project configuration.">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Project name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-pink-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Receiving address
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="project@filter.milltownpartners.com"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-pink-600 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Mailgun receives emails at this address and routes them to Filter.
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Slack channel ID
            </label>
            <input
              value={slackChannel}
              onChange={(e) => setSlackChannel(e.target.value)}
              placeholder="C0123456789"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-pink-600 focus:outline-none"
            />
          </div>
        </div>
      </SettingsSection>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </button>
      </div>
    </div>
  );
}
