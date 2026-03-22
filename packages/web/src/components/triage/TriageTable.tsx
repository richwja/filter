import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type Table,
} from '@tanstack/react-table';
import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScoreBadge } from './ScoreBadge';
import { FlagChips } from './FlagChips';
import type { TriageRow } from '@/hooks/useTriageRealtime';

interface TeamMember {
  id: string;
  name: string;
}

const col = createColumnHelper<TriageRow>();

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const baseColumns = [
  col.accessor('composite_score', {
    header: 'Priority',
    cell: (info) => <ScoreBadge score={Math.round(info.getValue() ?? 0)} />,
    size: 70,
  }),
  col.accessor((row) => row.emails?.from_name || row.emails?.from_address || '', {
    id: 'from',
    header: 'Reporter',
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className="truncate text-sm font-medium text-gray-900">
          {row.emails?.from_name || row.emails?.from_address}
        </div>
      );
    },
    size: 180,
  }),
  col.accessor('outlet_name', {
    header: 'Publication',
    cell: (info) => <span className="text-sm text-gray-700">{info.getValue() || '—'}</span>,
    size: 140,
  }),
  col.accessor((row) => row.emails?.subject || '', {
    id: 'subject',
    header: 'Subject',
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className="min-w-0">
          <div className="truncate text-sm text-gray-900">{row.emails?.subject}</div>
          {row.recommended_action && (
            <div className="truncate text-xs text-gray-500">
              {row.recommended_action.replace(/_/g, ' ')}
            </div>
          )}
        </div>
      );
    },
    size: 280,
  }),
  col.accessor('category', {
    header: 'Category',
    cell: (info) => (
      <span className="text-xs text-gray-500">{info.getValue()?.replace(/_/g, ' ')}</span>
    ),
    size: 120,
  }),
  col.accessor('flags', {
    header: 'Flags',
    cell: (info) => <FlagChips flags={info.getValue() ?? []} />,
    size: 180,
    enableSorting: false,
  }),
  col.accessor('status', {
    header: 'Status',
    cell: (info) => {
      const s = info.getValue();
      const color =
        s === 'new'
          ? 'text-pink-600'
          : s === 'in_progress'
            ? 'text-blue-600'
            : s === 'replied'
              ? 'text-green-600'
              : 'text-gray-500';
      return <span className={cn('text-xs font-medium', color)}>{s?.replace(/_/g, ' ')}</span>;
    },
    size: 90,
  }),
  col.accessor((row) => row.emails?.received_at || row.created_at, {
    id: 'time',
    header: 'Time',
    cell: (info) => <span className="text-xs text-gray-500">{timeAgo(info.getValue())}</span>,
    size: 60,
  }),
];

function buildAssignColumn(
  teamMembers: TeamMember[],
  onAssign?: (triageId: string, userId: string | null) => void,
) {
  return col.accessor('assigned_to', {
    header: 'Assign',
    cell: (info) => {
      const value = info.getValue();
      return (
        <select
          value={value || ''}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            onAssign?.(info.row.original.id, e.target.value || null);
          }}
          className="w-full rounded border border-gray-200 bg-white px-1.5 py-1 text-xs text-gray-700"
        >
          <option value="">—</option>
          {teamMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      );
    },
    size: 130,
    enableSorting: false,
  });
}

interface TriageTableProps {
  data: TriageRow[];
  onRowClick: (row: TriageRow) => void;
  onTableReady?: (table: Table<TriageRow>) => void;
  teamMembers?: TeamMember[];
  onAssign?: (triageId: string, userId: string | null) => void;
}

export function TriageTable({
  data,
  onRowClick,
  onTableReady,
  teamMembers,
  onAssign,
}: TriageTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'composite_score', desc: true }]);

  const columns = useMemo(
    () =>
      teamMembers?.length
        ? [
            ...baseColumns.slice(0, 7),
            buildAssignColumn(teamMembers, onAssign),
            ...baseColumns.slice(7),
          ]
        : baseColumns,
    [teamMembers, onAssign],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 50 } },
  });

  const onTableReadyRef = useRef(onTableReady);
  onTableReadyRef.current = onTableReady;
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    if (!notified) {
      onTableReadyRef.current?.(table);
      setNotified(true);
    }
  }, [table, notified]);

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-gray-200 bg-gray-50">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={cn(
                      'px-3 py-2.5 text-left text-xs font-medium text-gray-500',
                      header.column.getCanSort() &&
                        'cursor-pointer select-none hover:text-gray-700',
                    )}
                    style={{ width: header.getSize() }}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' && <ChevronUp className="h-3 w-3" />}
                      {header.column.getIsSorted() === 'desc' && (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick(row.original)}
                className={cn(
                  'border-b border-gray-100 transition-colors cursor-pointer hover:bg-gray-50',
                  row.original.is_new && 'border-l-2 border-l-pink-500 bg-pink-50',
                )}
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

      {table.getPageCount() > 1 && (
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-md border border-gray-200 px-3 py-1 transition-colors hover:bg-gray-50 disabled:opacity-30"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-md border border-gray-200 px-3 py-1 transition-colors hover:bg-gray-50 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
