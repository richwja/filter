import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Loader2, Send, ChevronsUpDown, Check } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { SettingsSection } from '@/components/settings/SettingsSection';
import type { AppContext } from '@/lib/types';

interface SlackChannel {
  id: string;
  name: string;
}

export function SettingsGeneral() {
  const { session, currentProject } = useOutletContext<AppContext>();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [slackChannel, setSlackChannel] = useState('');
  const [saving, setSaving] = useState(false);
  const [slackStatus, setSlackStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [channelsLoaded, setChannelsLoaded] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentProject) return;
    setName(currentProject.name || '');
    setAddress(currentProject.receiving_address || '');
    setSlackChannel(currentProject.slack_channel_id || '');
  }, [currentProject]);

  useEffect(() => {
    if (!currentProject || !session) return;
    fetch(`/api/projects/${currentProject.id}/slack/channels`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then(({ channels: chs }) => {
        setChannels(chs ?? []);
        setChannelsLoaded(true);
        if (!chs?.length) setManualMode(true);
      })
      .catch(() => {
        setChannelsLoaded(true);
        setManualMode(true);
      });
  }, [currentProject, session]);

  const selectedChannel = channels.find((c) => c.id === slackChannel);
  const filtered = channels.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  async function testSlackConnection() {
    if (!currentProject || !session || !slackChannel) return;
    setSlackStatus('testing');
    try {
      const res = await fetch(`/api/projects/${currentProject.id}/slack/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ channel_id: slackChannel }),
      });
      const data = await res.json();
      setSlackStatus(data.ok ? 'success' : 'error');
    } catch {
      setSlackStatus('error');
    }
  }

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
        </div>
      </SettingsSection>

      <SettingsSection
        title="Slack Notifications"
        description="Send triage alerts to a Slack channel when high-priority emails arrive."
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Slack channel</label>
            {channelsLoaded && !manualMode ? (
              <>
                <Popover.Root open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <Popover.Trigger asChild>
                    <button className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-pink-600 focus:outline-none">
                      <span className={selectedChannel ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedChannel ? `#${selectedChannel.name}` : 'Select a channel…'}
                      </span>
                      <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                    </button>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content
                      align="start"
                      sideOffset={4}
                      className="z-50 w-[var(--radix-popover-trigger-width)] rounded-md border border-gray-200 bg-white shadow-lg"
                      onOpenAutoFocus={(e) => {
                        e.preventDefault();
                        searchRef.current?.focus();
                      }}
                    >
                      <div className="border-b border-gray-200 p-2">
                        <input
                          ref={searchRef}
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search channels…"
                          className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-500 focus:border-pink-600 focus:outline-none"
                        />
                      </div>
                      <div className="max-h-56 overflow-y-auto p-1">
                        {filtered.length === 0 ? (
                          <p className="px-2 py-3 text-center text-sm text-gray-500">
                            No channels found
                          </p>
                        ) : (
                          filtered.map((ch) => (
                            <button
                              key={ch.id}
                              onClick={() => {
                                setSlackChannel(ch.id);
                                setSlackStatus('idle');
                                setPopoverOpen(false);
                                setSearch('');
                              }}
                              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Check
                                className={`h-4 w-4 ${ch.id === slackChannel ? 'text-pink-600' : 'text-transparent'}`}
                              />
                              #{ch.name}
                            </button>
                          ))
                        )}
                      </div>
                      <div className="border-t border-gray-200 p-2">
                        <button
                          onClick={() => {
                            setManualMode(true);
                            setPopoverOpen(false);
                          }}
                          className="w-full rounded-md px-2 py-1.5 text-left text-xs text-gray-500 hover:bg-gray-100"
                        >
                          Enter ID manually
                        </button>
                      </div>
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              </>
            ) : (
              <>
                <input
                  value={slackChannel}
                  onChange={(e) => {
                    setSlackChannel(e.target.value);
                    setSlackStatus('idle');
                  }}
                  placeholder="C0123456789"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-pink-600 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Open the channel in Slack for web — the channel ID is the{' '}
                  <code className="text-gray-600">C…</code> value at the end of the URL.
                </p>
                {channelsLoaded && channels.length > 0 && (
                  <button
                    onClick={() => setManualMode(false)}
                    className="mt-1 text-xs text-pink-600 hover:text-pink-700"
                  >
                    Pick from list instead
                  </button>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={testSlackConnection}
              disabled={!slackChannel || slackStatus === 'testing'}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              {slackStatus === 'testing' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send test message
            </button>
            {slackStatus === 'success' && (
              <span className="flex items-center gap-1.5 text-sm text-gray-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Connected
              </span>
            )}
            {slackStatus === 'error' && (
              <span className="flex items-center gap-1.5 text-sm text-gray-700">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Connection failed
              </span>
            )}
            {slackStatus === 'idle' && slackChannel && (
              <span className="flex items-center gap-1.5 text-sm text-gray-500">
                <span className="h-2 w-2 rounded-full bg-gray-300" />
                Not connected
              </span>
            )}
          </div>
        </div>
      </SettingsSection>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
        </button>
      </div>
    </div>
  );
}
