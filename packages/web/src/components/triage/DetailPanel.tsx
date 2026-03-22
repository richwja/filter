import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mail, Building2, User, Star, Maximize2, Minimize2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ScoreBadge } from './ScoreBadge';
import { FlagChips } from './FlagChips';
import { DraftReplyEditor } from './DraftReplyEditor';
import type { TriageRow } from '@/hooks/useTriageRealtime';
import type { AppContext } from '@/lib/types';

interface TeamMember {
  id: string;
  name: string;
}

interface DetailPanelProps {
  row: TriageRow | null;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  teamMembers?: TeamMember[];
  onAssign?: (triageId: string, userId: string | null) => void;
}

export function DetailPanel({
  row,
  onClose,
  onNext,
  onPrevious,
  teamMembers,
  onAssign,
}: DetailPanelProps) {
  const { session } = useOutletContext<AppContext>();
  const [status, setStatus] = useState(row?.status || 'new');
  const [expanded, setExpanded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (row) setStatus(row.status);
  }, [row?.id, row?.status]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!row) return;
      const target = e.target as HTMLElement;
      const inInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;

      if (e.key === 'Escape') {
        if (inInput) target.blur();
        else onClose();
        return;
      }
      if (inInput) return;
      if (e.key === 'ArrowDown' && onNext) {
        e.preventDefault();
        onNext();
      }
      if (e.key === 'ArrowUp' && onPrevious) {
        e.preventDefault();
        onPrevious();
      }
    },
    [row, onClose, onNext, onPrevious],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  function handleAssign(userId: string | null) {
    if (!row) return;
    onAssign?.(row.id, userId);
  }

  function handleStatusChange(newStatus: string) {
    setStatus(newStatus);
    if (!row) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch(`/api/projects/${row.project_id}/triage/${row.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      }).catch((err) => console.error('Failed to update status:', err));
    }, 300);
  }

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  if (!row) return null;

  const email = row.emails;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      <div
        className={cn(
          'fixed right-0 top-0 z-50 h-full overflow-y-auto border-l border-gray-200 bg-white shadow-2xl transition-all',
          expanded ? 'w-[90vw] max-w-5xl' : 'w-[680px]',
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900 tracking-heading truncate pr-4">
            {email?.subject || 'Email details'}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-5">
          <section className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">Sender</h3>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">
                  {email?.from_name || email?.from_address}
                </span>
              </div>
              {row.outlet_name && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{row.outlet_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">{email?.from_address}</span>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">Summary</h3>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                {row.summary || '(No body available)'}
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">AI Analysis</h3>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <ScoreBadge
                  score={row.composite_score ? Math.round(row.composite_score) : 0}
                  size="md"
                />
                <span className="text-sm font-medium text-gray-700">Impact</span>
              </div>
              <FlagChips flags={row.flags ?? []} />
              {row.reasoning && (
                <p className="text-sm text-gray-700 leading-relaxed">{row.reasoning}</p>
              )}
            </div>
          </section>

          {(row.talking_points?.length ?? 0) > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-medium text-gray-900">Talking Points</h3>
              <ul className="space-y-1.5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                {row.talking_points?.map((point, i) => (
                  <li key={`${row.id}-tp-${i}`} className="flex gap-2 text-sm text-gray-700">
                    <Star className="mt-0.5 h-3 w-3 shrink-0 text-pink-600" />
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {row.draft_reply_body && (
            <section className="space-y-2">
              <h3 className="text-sm font-medium text-gray-900">Draft Reply</h3>
              <DraftReplyEditor
                key={row.id}
                subject={row.draft_reply_subject || `Re: ${email?.subject || ''}`}
                body={row.draft_reply_body}
                toEmail={email?.from_address || ''}
              />
            </section>
          )}

          <section className="space-y-3 pb-6">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-700">Edit Status</label>
                <select
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                >
                  {['new', 'in_progress', 'replied', 'closed', 'no_action'].map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
              {teamMembers && teamMembers.length > 0 && (
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-gray-700">Assign</label>
                  <select
                    value={row.assigned_to || ''}
                    onChange={(e) => handleAssign(e.target.value || null)}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
