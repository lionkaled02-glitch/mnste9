'use client';

/**
 * خدمات — شريط بحث وفرز علوي للمشاريع
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { SORT_OPTIONS } from '@/lib/services/project-meta';

export function ProjectSearchBar({
  initialQ,
  initialSort,
}: {
  initialQ?: string;
  initialSort?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(initialQ || '');

  const updateQuery = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (!v) params.delete(k);
      else params.set(k, v);
    });
    if (!updates.page) params.delete('page');
    const qs = params.toString();
    return qs ? `/projects?${qs}` : '/projects';
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      router.push(updateQuery({ q: q.trim() || undefined }));
    });
  };

  const onSortChange = (value: string) => {
    startTransition(() => {
      router.push(updateQuery({ sort: value === 'newest' ? undefined : value }));
    });
  };

  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center ${isPending ? 'opacity-60' : ''}`}>
      <form onSubmit={onSearch} className="flex flex-1 items-center gap-2 rounded-[10px] border border-gray-200 bg-white p-1.5 shadow-sm focus-within:border-[#2386c8] focus-within:ring-2 focus-within:ring-[#2386c8]/10">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث بكلمات مفتاحية: برمجة، تصميم، تسويق..."
            className="h-10 w-full bg-transparent pr-9 pl-3 text-[13.5px] text-gray-800 placeholder:text-gray-400 outline-none"
          />
        </div>
        <button
          type="submit"
          className="h-10 rounded-[8px] bg-[#2386c8] px-5 text-[13px] font-bold text-white hover:bg-[#1a6da8]"
        >
          بحث
        </button>
      </form>

      <div className="flex items-center gap-2">
        <label className="text-[12px] font-medium text-[#666] whitespace-nowrap">ترتيب:</label>
        <select
          value={initialSort || 'newest'}
          onChange={(e) => onSortChange(e.target.value)}
          className="h-10 rounded-[10px] border border-gray-200 bg-white px-3 text-[13px] text-[#222] outline-none focus:border-[#2386c8] focus:ring-2 focus:ring-[#2386c8]/10"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
