import { useState } from 'react';
import { Check, ChevronRight, ChevronLeft, Loader2, LogOut } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { Project } from '@/hooks/useProject';

interface SetupWizardProps {
  project: Project;
  token: string;
  onActivated: () => void;
}

const STEPS = ['Project Basics', 'Client Briefing', 'Notifications', 'Activate'];

export function SetupWizard({ project, token, onActivated }: SetupWizardProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(project.name || '');
  const [address, setAddress] = useState(project.receiving_address || '');
  const [briefing, setBriefing] = useState('');
  const [slackChannel, setSlackChannel] = useState('');

  async function handleActivate() {
    setSaving(true);
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          receiving_address: address,
          client_context: briefing,
          slack_channel_id: slackChannel,
          status: 'active',
        }),
      });
      onActivated();
    } catch (err) {
      console.error('Failed to activate project:', err);
    }
    setSaving(false);
  }

  return (
    <Dialog.Root open onOpenChange={() => {}}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          className="fixed inset-4 z-50 mx-auto my-auto flex max-h-[90vh] max-w-2xl flex-col rounded-2xl bg-white shadow-2xl"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="border-b border-gray-200 px-8 py-6">
            <Dialog.Title className="text-xl font-semibold text-gray-900 tracking-heading">
              Set up {project.name || 'your project'}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-gray-500">
              Configure your project before emails start flowing.
            </Dialog.Description>
          </div>

          {/* Step indicators */}
          <div className="border-b border-gray-200 px-8 py-4">
            <div className="flex items-center gap-2">
              {STEPS.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors',
                      i < step
                        ? 'bg-pink-600 text-white'
                        : i === step
                          ? 'bg-pink-100 text-pink-600 ring-1 ring-pink-600'
                          : 'bg-gray-100 text-gray-400',
                    )}
                  >
                    {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      'text-xs',
                      i === step ? 'text-gray-900 font-medium' : 'text-gray-400',
                    )}
                  >
                    {label}
                  </span>
                  {i < STEPS.length - 1 && <div className="h-px w-6 bg-gray-200" />}
                </div>
              ))}
            </div>
          </div>

          {/* Step content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Project name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tesla"
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
                    placeholder="tesla@filter.milltownpartners.com"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-pink-600 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Mailgun receives emails at this address and routes them to Filter.
                  </p>
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Client briefing
                </label>
                <textarea
                  value={briefing}
                  onChange={(e) => setBriefing(e.target.value)}
                  rows={10}
                  placeholder="Describe the client's business, current media strategy, focus areas, key messages, sensitive topics, risks and opportunities."
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 placeholder:text-gray-500 leading-relaxed focus:border-pink-600 focus:outline-none resize-y"
                />
              </div>
            )}

            {step === 2 && (
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
                <p className="mt-1 text-xs text-gray-500">
                  High-priority emails will be sent to this Slack channel.
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">Review your setup</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name</span>
                    <span className="text-gray-900">{name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Address</span>
                    <span className="text-gray-900">{address || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Briefing</span>
                    <span className="text-gray-900">
                      {briefing ? `${briefing.length} chars` : 'Skipped'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Slack</span>
                    <span className="text-gray-900">{slackChannel || 'Not set'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer nav */}
          <div className="border-t border-gray-200 px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={() => {
                  supabase.auth.signOut();
                  window.location.href = '/login';
                }}
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-gray-600"
              >
                <LogOut className="h-3 w-3" /> Sign out
              </button>
            </div>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="inline-flex items-center gap-1.5 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-700"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleActivate}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Activate project
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
