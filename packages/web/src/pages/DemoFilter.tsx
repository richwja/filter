import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';
import { TriageTable } from '@/components/triage/TriageTable';
import { DetailPanel } from '@/components/triage/DetailPanel';
import { ExportButton } from '@/components/shared/ExportButton';
import { DEMO_TRIAGE } from '@/lib/demo';
import type { TriageRow } from '@/hooks/useTriageRealtime';
import type { AppContext } from '@/lib/types';

type ViewTab =
  | 'queue'
  | 'my_inbox'
  | 'urgent'
  | 'high_risk'
  | 'needs_approval'
  | 'new_contacts'
  | 'all';

const viewTabs: { value: ViewTab; label: string }[] = [
  { value: 'queue', label: 'Queue' },
  { value: 'my_inbox', label: 'My Inbox' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high_risk', label: 'High Risk' },
  { value: 'needs_approval', label: 'Needs Approval' },
  { value: 'new_contacts', label: 'New Contacts' },
  { value: 'all', label: 'All' },
];

export function DemoFilter() {
  const { user, currentProject } = useOutletContext<AppContext>();
  const [selectedRow, setSelectedRow] = useState<TriageRow | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const filtered = useMemo(() => {
    let rows = DEMO_TRIAGE as TriageRow[];

    switch (activeTab) {
      case 'queue':
        rows = rows.filter((r) => r.status === 'new');
        break;
      case 'my_inbox':
        rows = rows.filter((r) => r.assigned_to === user?.id);
        break;
      case 'urgent':
        rows = rows.filter((r) => (r.urgency_score ?? 0) >= 8);
        break;
      case 'high_risk':
        rows = rows.filter((r) => (r.risk_score ?? 0) >= 7);
        break;
      case 'needs_approval':
        rows = rows.filter((r) => r.draft_reply_requires_approval);
        break;
      case 'new_contacts':
        rows = rows.filter((r) => r.flags?.includes('New Contact'));
        break;
    }

    if (statusFilter) rows = rows.filter((r) => r.status === statusFilter);
    if (categoryFilter) rows = rows.filter((r) => r.category === categoryFilter);

    return rows;
  }, [activeTab, statusFilter, categoryFilter, user?.id]);

  const exportData = useMemo(
    () =>
      filtered.map((r) => ({
        score: r.composite_score ?? '',
        from: r.emails?.from_name || r.emails?.from_address || '',
        outlet: r.outlet_name || '',
        subject: r.emails?.subject || '',
        category: r.category || '',
        status: r.status || '',
        flags: (r.flags ?? []).join(', '),
        action: r.recommended_action || '',
        received: r.emails?.received_at || '',
      })),
    [filtered],
  );

  return (
    <div>
      <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as ViewTab)}>
        <div className="mb-4 flex items-center justify-between">
          <Tabs.List className="flex gap-1">
            {viewTabs.map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  activeTab === tab.value
                    ? 'bg-pink-600/10 text-pink-500'
                    : 'text-surface-600 hover:text-surface-800',
                )}
              >
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <ExportButton data={exportData} filename={`filter-${currentProject?.slug || 'export'}`} />
        </div>

        <div className="mb-4 flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-surface-300 bg-surface px-3 py-1.5 text-sm text-surface-800"
          >
            <option value="">All statuses</option>
            {['new', 'in_progress', 'replied', 'closed', 'no_action'].map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-surface-300 bg-surface px-3 py-1.5 text-sm text-surface-800"
          >
            <option value="">All categories</option>
            {[
              'media_inquiry',
              'interview_request',
              'press_release_pitch',
              'event_invitation',
              'partnership_inquiry',
              'pr_agency_pitch',
              'other',
            ].map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        <TriageTable data={filtered} onRowClick={setSelectedRow} />
      </Tabs.Root>
      <DetailPanel row={selectedRow} onClose={() => setSelectedRow(null)} />
    </div>
  );
}
