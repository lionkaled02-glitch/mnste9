import type { ReactNode } from 'react';

import { EmptyState } from './empty-state';

interface DataTableProps {
  columns: string[];
  children: ReactNode;
  empty?: boolean;
  emptyTitle?: string;
}

export function DataTable({ columns, children, empty, emptyTitle = 'لا توجد بيانات' }: DataTableProps) {
  if (empty) return <EmptyState title={emptyTitle} description="غيّر الفلاتر أو عد لاحقاً." />;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-right text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={column} className="whitespace-nowrap px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-500">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{children}</tbody>
        </table>
      </div>
    </div>
  );
}
