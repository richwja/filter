import { Download } from 'lucide-react';

interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename: string;
}

function toCsv(data: Record<string, unknown>[]): string {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        const str = val == null ? '' : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}

export function ExportButton({ data, filename }: ExportButtonProps) {
  function handleExport() {
    const csv = toCsv(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      disabled={!data.length}
      className="inline-flex items-center gap-1.5 rounded-md border border-surface-300 bg-surface px-3 py-1.5 text-sm font-medium text-surface-800 transition-colors hover:bg-surface-100 disabled:opacity-50"
    >
      <Download className="h-4 w-4" />
      Export to CSV
    </button>
  );
}
