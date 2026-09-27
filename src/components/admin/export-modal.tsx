'use client';

import { useState } from 'react';

interface ExportModalProps {
  data: Record<string, unknown>[];
  columns: { key: string; label: string }[];
  title: string;
}

export function ExportButton({ data, columns, title }: ExportModalProps) {
  const [open, setOpen] = useState(false);

  const exportToCsv = () => {
    const bom = '\uFEFF';
    const headers = columns.map((column) => column.label).join(',');
    const rows = data
      .map((row) => columns.map((column) => `"${String(row[column.key] ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const csv = `${bom}${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="rounded-lg bg-[#2386c8] px-4 py-2 text-sm font-bold text-white hover:bg-[#1a6da8]">📥 تصدير البيانات</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <h2 className="mb-4 text-xl font-bold text-[#1a1a2e]">تصدير {title}</h2>
            <p className="mb-4 text-sm text-slate-500">معاينة أول 5 صفوف من {data.length}.</p>
            <div className="mb-4 max-h-60 overflow-auto rounded-lg border border-slate-200">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50">
                  <tr>{columns.map((column) => <th key={column.key} className="px-3 py-2 text-right font-extrabold text-slate-600">{column.label}</th>)}</tr>
                </thead>
                <tbody>
                  {data.slice(0, 5).map((row, index) => (
                    <tr key={index} className="border-t border-slate-100">
                      {columns.map((column) => <td key={column.key} className="px-3 py-2">{String(row[column.key] ?? '—')}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={exportToCsv} className="flex-1 rounded-xl bg-[#2386c8] px-4 py-3 font-bold text-white">📥 تنزيل Excel (CSV)</button>
              <button type="button" onClick={() => window.print()} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-bold">🖨️ طباعة</button>
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 px-4 py-3 font-bold">❌ إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
