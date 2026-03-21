import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExportButton } from '@/components/shared/ExportButton';
import { ColumnToggle } from '@/components/shared/ColumnToggle';
import type { AppContext } from '@/lib/types';

interface Contact {
  id: string;
  name: string | null;
  email: string | null;
  outlet: string | null;
  title: string | null;
  beat: string | null;
  tier: number | null;
  relationship_status: string;
  source: string;
  last_interaction_at: string | null;
}

const col = createColumnHelper<Contact>();

const tierColors: Record<number, string> = {
  1: 'bg-pink-600/15 text-pink-400',
  2: 'bg-blue-500/15 text-blue-400',
  3: 'bg-surface-300/40 text-surface-600',
};

const relColors: Record<string, string> = {
  strong: 'bg-green-500/15 text-green-400',
  warm: 'bg-amber-500/15 text-amber-400',
  cold: 'bg-blue-500/15 text-blue-400',
  new: 'bg-teal-500/15 text-teal-400',
  unknown: 'bg-surface-300/40 text-surface-600',
};

const columns = [
  col.accessor('name', {
    header: 'Name',
    cell: (info) => (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-surface-950">{info.getValue() || '—'}</span>
        {info.row.original.source === 'auto_discovered' && (
          <span className="rounded bg-teal-500/15 px-1 py-0.5 text-[10px] font-medium text-teal-400">
            New
          </span>
        )}
      </div>
    ),
  }),
  col.accessor('email', {
    header: 'Email',
    cell: (info) => <span className="text-sm text-surface-700">{info.getValue()}</span>,
  }),
  col.accessor('outlet', {
    header: 'Outlet',
    cell: (info) => <span className="text-sm text-surface-700">{info.getValue()}</span>,
  }),
  col.accessor('title', {
    header: 'Title',
    cell: (info) => <span className="text-sm text-surface-600">{info.getValue()}</span>,
  }),
  col.accessor('beat', {
    header: 'Beat',
    cell: (info) => <span className="text-sm text-surface-600">{info.getValue()}</span>,
  }),
  col.accessor('tier', {
    header: 'Tier',
    cell: (info) => {
      const t = info.getValue();
      if (!t) return null;
      return (
        <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', tierColors[t])}>
          Tier {t}
        </span>
      );
    },
  }),
  col.accessor('relationship_status', {
    header: 'Relationship',
    cell: (info) => {
      const s = info.getValue();
      return (
        <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', relColors[s])}>{s}</span>
      );
    },
  }),
  col.accessor('last_interaction_at', {
    header: 'Last Interaction',
    cell: (info) => {
      const d = info.getValue();
      return (
        <span className="text-xs text-surface-500">
          {d ? new Date(d).toLocaleDateString() : '—'}
        </span>
      );
    },
  }),
];

export function Relationships() {
  const { session, currentProject } = useOutletContext<AppContext>();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    if (!currentProject || !session) {
      setContacts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/projects/${currentProject.id}/contacts`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then(({ contacts: c }) => setContacts(c ?? []))
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }, [currentProject, session]);

  const table = useReactTable({
    data: contacts,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <Loader2 className="h-6 w-6 animate-spin text-surface-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-surface-950 tracking-heading">Relationships</h1>
        <div className="flex gap-2">
          <ExportButton
            data={contacts as unknown as Record<string, unknown>[]}
            filename="contacts"
          />
          <ColumnToggle table={table} />
          <button className="inline-flex items-center gap-1.5 rounded-md bg-pink-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-pink-700">
            <Plus className="h-4 w-4" /> Add contact
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-300">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-surface-300 bg-surface-100">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="cursor-pointer px-3 py-2.5 text-left text-xs font-medium text-surface-600 hover:text-surface-800"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-surface-300/50 transition-colors hover:bg-surface-100"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
