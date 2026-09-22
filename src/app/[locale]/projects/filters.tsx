'use client';

/**
 * ============================================================================
 *  mnste9 — فلاتر المشاريع (مكوّن عميل)
 * ============================================================================
 *  ثلاث قوائم منسدلة (التصنيف / الميزانية / الترتيب) تعمل بتغيير معاملات
 *  URL (searchParams) والتنقل إلى الصفحة الجديدة — الحالة تعيش في الرابط:
 *   - روابط قابلة للمشاركة والرجوع (زر الرجوع في المتصفح يعمل).
 *   - الخادم يعيد عرض النتائج المطابقة (لا حالة على العميل).
 *   - أثناء الانتقال (useTransition) تُعتّم اللوحة قليلاً كمؤشر انتظار.
 * ============================================================================
 */

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import {
  BUDGET_FILTERS,
  PROJECT_CATEGORIES,
  SORT_OPTIONS,
} from '@/lib/services/project-meta';
import { cn } from '@/lib/utils';

interface ProjectFiltersProps {
  category?: string;
  budget?: string;
  sort: string;
}

/** صنف موحّد للقوائم المنسدلة */
const SELECT_CLASSES =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40';

/** بناء رابط /projects بالفلاتر المدمجة (تجاهُل القيم الفارغة والافتراضية) */
function buildProjectsUrl(
  current: ProjectFiltersProps,
  overrides: Partial<ProjectFiltersProps>,
): string {
  const merged = { ...current, ...overrides };
  const params = new URLSearchParams();

  if (merged.category) params.set('category', merged.category);
  if (merged.budget) params.set('budget', merged.budget);
  if (merged.sort && merged.sort !== 'newest') params.set('sort', merged.sort);

  const queryString = params.toString();
  return queryString ? `/projects?${queryString}` : '/projects';
}

export function ProjectFilters(props: ProjectFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  /** التنقل إلى الرابط بعد أي تغيير في الفلاتر */
  const navigate = (overrides: Partial<ProjectFiltersProps>) => {
    startTransition(() => {
      router.push(buildProjectsUrl(props, overrides));
    });
  };

  const hasActiveFilters = Boolean(props.category || props.budget);

  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition',
        isPending && 'pointer-events-none opacity-60',
      )}
      aria-busy={isPending}
    >
      <h2 className="text-base font-bold text-slate-900">تصفية النتائج</h2>

      <div className="mt-5 space-y-4">
        {/* التصنيف */}
        <div>
          <label
            htmlFor="filter-category"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            التصنيف
          </label>
          <select
            id="filter-category"
            value={props.category ?? ''}
            onChange={(event) => navigate({ category: event.target.value })}
            className={SELECT_CLASSES}
            disabled={isPending}
          >
            <option value="">الكل</option>
            {PROJECT_CATEGORIES.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* الميزانية */}
        <div>
          <label
            htmlFor="filter-budget"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            الميزانية
          </label>
          <select
            id="filter-budget"
            value={props.budget ?? ''}
            onChange={(event) => navigate({ budget: event.target.value })}
            className={SELECT_CLASSES}
            disabled={isPending}
          >
            <option value="">الكل</option>
            {BUDGET_FILTERS.map((budget) => (
              <option key={budget.value} value={budget.value}>
                {budget.label}
              </option>
            ))}
          </select>
        </div>

        {/* الترتيب */}
        <div>
          <label
            htmlFor="filter-sort"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            الترتيب
          </label>
          <select
            id="filter-sort"
            value={props.sort}
            onChange={(event) => navigate({ sort: event.target.value })}
            className={SELECT_CLASSES}
            disabled={isPending}
          >
            {SORT_OPTIONS.map((sort) => (
              <option key={sort.value} value={sort.value}>
                {sort.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => startTransition(() => router.push('/projects'))}
          className="mt-5 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 hover:underline"
          disabled={isPending}
        >
          إزالة الفلاتر
        </button>
      )}
    </div>
  );
}
