'use client';

/**
 * خدمات — فلاتر جانبية للمشاريع — إصلاح التدويل
 * يستخدم navigation من next-intl مع بادئة اللغة
 */

import { useRouter, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { PROJECT_CATEGORIES, STATUS_FILTERS } from '@/lib/services/project-meta';

export function ProjectFiltersSidebar({
  initialCategory,
  initialBudgetMin,
  initialBudgetMax,
  initialStatus,
}: {
  initialCategory?: string;
  initialBudgetMin?: string;
  initialBudgetMax?: string;
  initialStatus?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [budgetMin, setBudgetMin] = useState(initialBudgetMin || '');
  const [budgetMax, setBudgetMax] = useState(initialBudgetMax || '');

  const updateQuery = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (!v) params.delete(k);
      else params.set(k, v);
    });
    if (!updates.page) params.delete('page');
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const navigate = (updates: Record<string, string | undefined>) => {
    startTransition(() => {
      router.push(updateQuery(updates));
    });
  };

  const hasActive =
    !!initialCategory || !!initialBudgetMin || !!initialBudgetMax || !!initialStatus;

  return (
    <div className={`rounded-[12px] border border-gray-200 bg-white p-5 shadow-sm transition ${isPending ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-bold text-[#222]">الفلاتر</h2>
        {hasActive && (
          <button
            onClick={() => navigate({ category: undefined, budgetMin: undefined, budgetMax: undefined, status: undefined, budget: undefined })}
            className="text-[12px] font-medium text-[#2386c8] hover:text-[#1a6da8]"
          >
            مسح الكل
          </button>
        )}
      </div>

      {/* التصنيف */}
      <div className="mt-5">
        <h3 className="text-[12px] font-bold text-[#444]">القسم</h3>
        <div className="mt-3 space-y-2 max-h-[220px] overflow-y-auto pr-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="category"
              checked={!initialCategory}
              onChange={() => navigate({ category: undefined })}
              className="h-4 w-4 accent-[#2386c8]"
            />
            <span className="text-[13px] text-[#555] group-hover:text-[#222]">الكل</span>
          </label>
          {PROJECT_CATEGORIES.slice(0, 8).map((cat) => (
            <label key={cat.slug} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="category"
                checked={initialCategory === cat.slug}
                onChange={() => navigate({ category: cat.slug })}
                className="h-4 w-4 accent-[#2386c8]"
              />
              <span className="text-[13px] text-[#555] group-hover:text-[#222]">{cat.label}</span>
            </label>
          ))}
        </div>
      </div>

      <hr className="my-5 border-gray-100" />

      {/* الميزانية min/max */}
      <div>
        <h3 className="text-[12px] font-bold text-[#444]">الميزانية ($)</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-[#888]">من</label>
            <input
              type="number"
              min={0}
              placeholder="0"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              className="mt-1 w-full rounded-[8px] border border-gray-200 bg-[#fcfcfc] px-3 py-2 text-[13px] outline-none focus:border-[#2386c8] focus:bg-white focus:ring-2 focus:ring-[#2386c8]/10"
            />
          </div>
          <div>
            <label className="text-[11px] text-[#888]">إلى</label>
            <input
              type="number"
              min={0}
              placeholder="1000"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              className="mt-1 w-full rounded-[8px] border border-gray-200 bg-[#fcfcfc] px-3 py-2 text-[13px] outline-none focus:border-[#2386c8] focus:bg-white focus:ring-2 focus:ring-[#2386c8]/10"
            />
          </div>
        </div>
        <button
          onClick={() => navigate({ budgetMin: budgetMin || undefined, budgetMax: budgetMax || undefined })}
          className="mt-3 w-full rounded-[8px] bg-[#222] px-3 py-2 text-[12px] font-bold text-white hover:bg-black"
        >
          تطبيق الميزانية
        </button>
      </div>

      <hr className="my-5 border-gray-100" />

      {/* حالة المشروع */}
      <div>
        <h3 className="text-[12px] font-bold text-[#444]">حالة المشروع</h3>
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="status"
              checked={!initialStatus}
              onChange={() => navigate({ status: undefined })}
              className="h-4 w-4 accent-[#2386c8]"
            />
            <span className="text-[13px] text-[#555] group-hover:text-[#222]">الكل</span>
          </label>
          {STATUS_FILTERS.map((s) => (
            <label key={s.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="status"
                checked={initialStatus === s.value}
                onChange={() => navigate({ status: s.value })}
                className="h-4 w-4 accent-[#2386c8]"
              />
              <span className="text-[13px] text-[#555] group-hover:text-[#222]">{s.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* معلومات الضمان */}
      <div className="mt-6 rounded-[10px] bg-[#f4f5f7] p-3">
        <div className="flex items-center gap-2 text-[12px] font-bold text-[#222]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2386c8]/10 text-[#2386c8]">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </span>
          ضمان خدمات
        </div>
        <p className="mt-2 text-[11px] leading-5 text-[#666]">جميع المشاريع محمية بضمان خدمات — حقك المالي محفوظ حتى التسليم.</p>
      </div>
    </div>
  );
}
