import { Columns3 } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { Table } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

interface ColumnToggleProps<T> {
  table: Table<T>;
}

export function ColumnToggle<T>({ table }: ColumnToggleProps<T>) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
          <Columns3 className="h-4 w-4" />
          Columns
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[180px] rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
        >
          {table.getAllLeafColumns().map((column) => {
            if (!column.getCanHide()) return null;
            return (
              <DropdownMenu.CheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(val) => column.toggleVisibility(!!val)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-gray-50',
                  column.getIsVisible() ? 'text-gray-700' : 'text-gray-500',
                )}
              >
                <DropdownMenu.ItemIndicator>
                  <div className="h-3 w-3 rounded-sm bg-pink-600" />
                </DropdownMenu.ItemIndicator>
                <div
                  className={cn(
                    'h-3 w-3 rounded-sm border border-gray-300',
                    column.getIsVisible() && 'hidden',
                  )}
                />
                {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
              </DropdownMenu.CheckboxItem>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
