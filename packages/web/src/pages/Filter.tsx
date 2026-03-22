import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { Loader2, Download } from 'lucide-react';
import type { Table } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { useTriageRealtime, type TriageRow } from '@/hooks/useTriageRealtime';
import { TriageTable } from '@/components/triage/TriageTable';
import { DetailPanel } from '@/components/triage/DetailPanel';
import { StoriesView } from '@/components/triage/StoriesView';
import { ExportButton } from '@/components/shared/ExportButton';
import { ColumnToggle } from '@/components/shared/ColumnToggle';
import { FilterBar } from '@/components/shared/FilterBar';
import { DEMO_TEAM, generateDemoData } from '@/lib/demo';
import type { AppContext } from '@/lib/types';

const DEMO_STORIES = generateDemoData().stories;

type ViewTab =
  | 'queue'
  | 'my_inbox'
  | 'stories'
  | 'urgent'
  | 'high_risk'
  | 'needs_approval'
  | 'new_contacts'
  | 'all';

const viewTabs: { value: ViewTab; label: string }[] = [
  { value: 'queue', label: 'Queue' },
  { value: 'my_inbox', label: 'My Inbox' },
  { value: 'stories', label: 'Stories' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high_risk', label: 'High Risk' },
  { value: 'needs_approval', label: 'Needs Approval' },
  { value: 'new_contacts', label: 'New Contacts' },
  { value: 'all', label: 'All' },
];

const visibleTabs: ViewTab[] = ['queue', 'my_inbox', 'stories'];

export function Filter() {
  const { user, currentProject, session } = useOutletContext<AppContext>();
  const { results, loading } = useTriageRealtime(currentProject?.id);
  const [selectedRow, setSelectedRow] = useState<TriageRow | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>('queue');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [assignFilter, setAssignFilter] = useState('');
  const [triageTable, setTriageTable] = useState<Table<TriageRow> | null>(null);

  function handleAssign(triageId: string, userId: string | null) {
    fetch(`/api/projects/${currentProject?.id}/triage/${triageId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ assigned_to: userId }),
    }).catch((err) => console.error('Failed to update assignment:', err));
  }

  function handleNext() {
    if (!selectedRow) return;
    const idx = filtered.findIndex((r) => r.id === selectedRow.id);
    if (idx < filtered.length - 1) setSelectedRow(filtered[idx + 1]);
  }

  function handlePrevious() {
    if (!selectedRow) return;
    const idx = filtered.findIndex((r) => r.id === selectedRow.id);
    if (idx > 0) setSelectedRow(filtered[idx - 1]);
  }

  const filtered = useMemo(() => {
    let rows = results;

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
    if (assignFilter === 'unassigned') rows = rows.filter((r) => !r.assigned_to);
    else if (assignFilter) rows = rows.filter((r) => r.assigned_to === assignFilter);

    return rows;
  }, [results, activeTab, statusFilter, categoryFilter, assignFilter, user?.id]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div>
      <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as ViewTab)}>
        <FilterBar
          left={
            <Tabs.List className="flex gap-1">
              {viewTabs
                .filter((t) => visibleTabs.includes(t.value))
                .map((tab) => (
                  <Tabs.Trigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      activeTab === tab.value
                        ? 'bg-pink-50 text-pink-600'
                        : 'text-gray-500 hover:text-gray-700',
                    )}
                  >
                    {tab.label}
                  </Tabs.Trigger>
                ))}
            </Tabs.List>
          }
          right={
            <>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700"
              >
                <option value="">Status</option>
                {['new', 'in_progress', 'replied', 'closed', 'no_action'].map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-8 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700"
              >
                <option value="">Categories</option>
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
              <select
                value={assignFilter}
                onChange={(e) => setAssignFilter(e.target.value)}
                className="h-8 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700"
              >
                <option value="">Owners</option>
                <option value="unassigned">Unassigned</option>
                {DEMO_TEAM.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {triageTable && <ColumnToggle table={triageTable} />}
              <ExportButton
                data={exportData}
                filename={`filter-${currentProject?.slug || 'export'}`}
              />
              <ExportButton
                data={exportData}
                filename={`filter-${currentProject?.slug || 'export'}-sheets`}
                icon={<Download className="h-4 w-4" />}
                label="Export to Google Sheets"
              />
            </>
          }
        />

        {activeTab === 'stories' ? (
          <StoriesView
            stories={DEMO_STORIES}
            allRows={results}
            teamMembers={DEMO_TEAM}
            onRowClick={setSelectedRow}
            onAssignOwner={handleAssign}
          />
        ) : (
          <TriageTable
            data={filtered}
            onRowClick={setSelectedRow}
            onTableReady={setTriageTable}
            teamMembers={DEMO_TEAM}
            onAssign={handleAssign}
          />
        )}
      </Tabs.Root>
      <DetailPanel
        row={selectedRow}
        onClose={() => setSelectedRow(null)}
        onNext={handleNext}
        onPrevious={handlePrevious}
        teamMembers={DEMO_TEAM}
        onAssign={handleAssign}
      />
    </div>
  );
}
