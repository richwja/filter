import { X, Mail, Building2, User, Star } from 'lucide-react';
import { ScoreBadge } from './ScoreBadge';
import { FlagChips } from './FlagChips';
import { DraftReplyEditor } from './DraftReplyEditor';
import type { TriageRow } from '@/hooks/useTriageRealtime';

interface DetailPanelProps {
  row: TriageRow | null;
  onClose: () => void;
}

export function DetailPanel({ row, onClose }: DetailPanelProps) {
  if (!row) return null;

  const email = row.emails;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-[520px] overflow-y-auto border-l border-surface-300 bg-surface-50 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-300 bg-surface-50 px-5 py-4">
          <h2 className="text-lg font-semibold text-surface-950 tracking-heading truncate pr-4">
            {email?.subject || 'Email details'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-surface-600 transition-colors hover:bg-surface-200 hover:text-surface-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-5">
          {/* Sender profile */}
          <section className="space-y-2">
            <h3 className="text-sm font-medium text-surface-600">Sender</h3>
            <div className="rounded-xl border border-surface-300 bg-surface p-4 space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-surface-500" />
                <span className="text-sm font-medium text-surface-950">
                  {email?.from_name || email?.from_address}
                </span>
              </div>
              {row.outlet_name && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-surface-500" />
                  <span className="text-sm text-surface-800">{row.outlet_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-surface-500" />
                <span className="text-sm text-surface-600">{email?.from_address}</span>
              </div>
            </div>
          </section>

          {/* Email body */}
          <section className="space-y-2">
            <h3 className="text-sm font-medium text-surface-600">Email</h3>
            <div className="rounded-xl border border-surface-300 bg-surface p-4">
              <p className="whitespace-pre-wrap text-sm text-surface-800 leading-relaxed">
                {row.summary || '(No body available)'}
              </p>
            </div>
          </section>

          {/* AI Analysis */}
          <section className="space-y-2">
            <h3 className="text-sm font-medium text-surface-600">AI Analysis</h3>
            <div className="rounded-xl border border-surface-300 bg-surface p-4 space-y-3">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <ScoreBadge
                    score={row.composite_score ? Math.round(row.composite_score) : 0}
                    size="md"
                  />
                  <div className="mt-1 text-[10px] text-surface-500">Composite</div>
                </div>
                <div className="flex gap-3">
                  {[
                    { label: 'Impact', score: row.impact_score },
                    { label: 'Urgency', score: row.urgency_score },
                    { label: 'Risk', score: row.risk_score },
                  ].map(({ label, score }) => (
                    <div key={label} className="text-center">
                      <ScoreBadge score={score ?? 0} />
                      <div className="mt-1 text-[10px] text-surface-500">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <FlagChips flags={row.flags ?? []} />

              {row.reasoning && (
                <p className="text-sm text-surface-700 leading-relaxed">{row.reasoning}</p>
              )}
            </div>
          </section>

          {/* Talking points */}
          {(row.talking_points?.length ?? 0) > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-medium text-surface-600">Talking points</h3>
              <ul className="space-y-1.5 rounded-xl border border-surface-300 bg-surface p-4">
                {row.talking_points?.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm text-surface-800">
                    <Star className="mt-0.5 h-3 w-3 shrink-0 text-pink-500" />
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Draft reply */}
          {row.draft_reply_body && (
            <section className="space-y-2">
              <DraftReplyEditor
                subject={row.draft_reply_subject || `Re: ${email?.subject || ''}`}
                body={row.draft_reply_body}
                tone={row.draft_reply_tone || undefined}
                requiresApproval={row.draft_reply_requires_approval}
                toEmail={email?.from_address || ''}
              />
            </section>
          )}

          {/* Status + Assignment */}
          <section className="space-y-3 pb-6">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-surface-500">Status</label>
                <select className="w-full rounded-md border border-surface-300 bg-surface px-3 py-2 text-sm text-surface-800">
                  {['new', 'in_progress', 'replied', 'closed', 'no_action'].map((s) => (
                    <option key={s} value={s} selected={s === row.status}>
                      {s.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-surface-500">Assigned to</label>
                <select className="w-full rounded-md border border-surface-300 bg-surface px-3 py-2 text-sm text-surface-800">
                  <option value="">Unassigned</option>
                </select>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
