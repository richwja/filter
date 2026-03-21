import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScoreBadge } from './ScoreBadge';
import { FlagChips } from './FlagChips';
import { ColumnToggle } from '../shared/ColumnToggle';
import type { TriageRow } from '@/hooks/useTriageRealtime';

const col = createColumnHelper<TriageRow>();

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const columns = [
  col.accessor('composite_score', {
    header: 'Score',
    cell: (info) => <ScoreBadge score={Math.round(info.getValue() ?? 0)} />,
    size: 70,
  }),
  col.accessor((row) => row.emails?.from_name || row.emails?.from_address || '', {
    id: 'from',
    header: 'From',
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-surface-950">
            {row.emails?.from_name || row.emails?.from_address}
          </div>
          {row.outlet_name && (
            <div className="truncate text-xs text-surface-600">{row.outlet_name}</div>
          )}
        </div>
      );
    },
    size: 180,
  }),
  col.accessor((row) => row.emails?.subject || '', {
    id: 'subject',
    header: 'Subject',
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className="min-w-0">
          <div className="truncate text-sm text-surface-900">{row.emails?.subject}</div>
          {row.recommended_action && (
            <div className="truncate text-xs text-surface-500">
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
      <span className="text-xs text-surface-600">{info.getValue()?.replace(/_/g, ' ')}</span>
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
          ? 'text-pink-500'
          : s === 'in_progress'
            ? 'text-blue-400'
            : s === 'replied'
              ? 'text-green-400'
              : 'text-surface-500';
      return <span className={cn('text-xs font-medium', color)}>{s?.replace(/_/g, ' ')}</span>;
    },
    size: 90,
  }),
  col.accessor((row) => row.emails?.received_at || row.created_at, {
    id: 'time',
    header: 'Time',
    cell: (info) => <span className="text-xs text-surface-500">{timeAgo(info.getValue())}</span>,
    size: 60,
  }),
];

interface TriageTableProps {
  data: TriageRow[];
  onRowClick: (row: TriageRow) => void;
}

export function TriageTable({ data, onRowClick }: TriageTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'composite_score', desc: true }]);

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

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <ColumnToggle table={table} />
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
                    className={cn(
                      'px-3 py-2.5 text-left text-xs font-medium text-surface-600',
                      header.column.getCanSort() &&
                        'cursor-pointer select-none hover:text-surface-800',
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
                  'border-b border-surface-300/50 transition-colors cursor-pointer hover:bg-surface-100',
                  row.original.is_new && 'border-l-2 border-l-pink-500 bg-pink-600/5',
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
        <div className="mt-3 flex items-center justify-between text-xs text-surface-600">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-md border border-surface-300 px-3 py-1 transition-colors hover:bg-surface-100 disabled:opacity-30"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-md border border-surface-300 px-3 py-1 transition-colors hover:bg-surface-100 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
