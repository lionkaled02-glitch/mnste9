'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function ReportsFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const period = params.get('period') ?? '30d';
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
        الفترة
        <select value={period} onChange={(event) => router.push(`/admin/reports?period=${event.target.value}`)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
          <option value="today">اليوم</option>
          <option value="7d">آخر 7 أيام</option>
          <option value="30d">آخر 30 يوم</option>
          <option value="year">آخر سنة</option>
        </select>
      </label>
      <button type="button" onClick={() => window.print()} className="rounded-xl bg-[#1a1a2e] px-4 py-2 text-sm font-bold text-white">تصدير PDF</button>
    </div>
  );
}
