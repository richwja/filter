import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Check, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Project } from '@/hooks/useProject';
import type { UserProfile } from '@/hooks/useAuth';

const STEPS = ['Project', 'Media List', 'Company Context', 'Team', 'Review'];

export function Setup() {
  const { currentProject } = useOutletContext<{
    user: UserProfile;
    currentProject: Project | null;
  }>();
  const [step, setStep] = useState(0);
  const [saving] = useState(false);

  // Form state
  const [name, setName] = useState(currentProject?.name || '');
  const [address, setAddress] = useState(currentProject?.receiving_address || '');
  const [sheetUrl, setSheetUrl] = useState('');
  const [briefing, setBriefing] = useState('');
  const [slackChannel, setSlackChannel] = useState('');
  const [teamEmails, setTeamEmails] = useState('');

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold text-surface-950 tracking-heading">
        {currentProject ? 'Project Setup' : 'New Project'}
      </h1>

      {/* Step indicators */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors',
                i < step
                  ? 'bg-pink-600 text-white'
                  : i === step
                    ? 'bg-pink-600/20 text-pink-500 ring-1 ring-pink-600'
                    : 'bg-surface-200 text-surface-500',
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className={cn(
                'text-xs',
                i === step ? 'text-surface-950 font-medium' : 'text-surface-500',
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="h-px w-6 bg-surface-300" />}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-surface-300 bg-surface-50 p-6">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-800">
                Project name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Joby Aviation"
                className="w-full rounded-md border border-surface-300 bg-surface px-3 py-2 text-sm text-surface-900 placeholder:text-surface-500 focus:border-pink-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-800">
                Receiving address
              </label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="joby@filter.milltownpartners.com"
                className="w-full rounded-md border border-surface-300 bg-surface px-3 py-2 text-sm text-surface-900 placeholder:text-surface-500 focus:border-pink-600 focus:outline-none"
              />
              <p className="mt-1 text-xs text-surface-500">
                Mailgun receives emails at this address and routes them to Filter.
              </p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-800">
                Google Sheet URL
              </label>
              <input
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full rounded-md border border-surface-300 bg-surface px-3 py-2 text-sm text-surface-900 placeholder:text-surface-500 focus:border-pink-600 focus:outline-none"
              />
              <p className="mt-1 text-xs text-surface-500">
                Link your media list to sync contacts. You can also upload a CSV later.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-800">
                Client briefing
              </label>
              <textarea
                value={briefing}
                onChange={(e) => setBriefing(e.target.value)}
                rows={8}
                placeholder="Describe the client's business, current media strategy, focus areas, key messages, sensitive topics, risks and opportunities."
                className="w-full rounded-md border border-surface-300 bg-surface px-3 py-3 text-sm text-surface-900 placeholder:text-surface-500 leading-relaxed focus:border-pink-600 focus:outline-none resize-y"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-800">
                Slack channel ID
              </label>
              <input
                value={slackChannel}
                onChange={(e) => setSlackChannel(e.target.value)}
                placeholder="C0123456789"
                className="w-full rounded-md border border-surface-300 bg-surface px-3 py-2 text-sm text-surface-900 placeholder:text-surface-500 focus:border-pink-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-800">
                Team members (emails, one per line)
              </label>
              <textarea
                value={teamEmails}
                onChange={(e) => setTeamEmails(e.target.value)}
                rows={4}
                placeholder="sarah@milltown.com&#10;james@milltown.com"
                className="w-full rounded-md border border-surface-300 bg-surface px-3 py-2 text-sm text-surface-900 placeholder:text-surface-500 focus:border-pink-600 focus:outline-none resize-y"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-surface-950">Review your setup</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-surface-600">Name</span>
                <span className="text-surface-900">{name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-600">Address</span>
                <span className="text-surface-900">{address || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-600">Media sheet</span>
                <span className="text-surface-900">{sheetUrl ? 'Linked' : 'Skipped'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-600">Briefing</span>
                <span className="text-surface-900">
                  {briefing ? `${briefing.length} chars` : 'Skipped'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-600">Slack</span>
                <span className="text-surface-900">{slackChannel || 'Not set'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-4 flex justify-between">
        <button
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="inline-flex items-center gap-1.5 rounded-md border border-surface-300 px-4 py-2 text-sm font-medium text-surface-800 transition-colors hover:bg-surface-100 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="inline-flex items-center gap-1.5 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-700"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Activate project
          </button>
        )}
      </div>
    </div>
  );
}
