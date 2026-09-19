/**
 * ============================================================================
 *  mnste9 — صفحة المشاريع (/projects)
 * ============================================================================
 *  قائمة المشاريع مع فلاتر جانبية (التصنيف / الميزانية / الترتيب).
 *
 *  التخطيط (مواصفة المرحلة):
 *   - Container: max-w-7xl mx-auto px-4 py-8.
 *   - Grid: grid-cols-1 lg:grid-cols-12 gap-6.
 *   - العمود الأيسر (lg:col-span-8): قائمة المشاريع.
 *   - العمود الأيمن (lg:col-span-4): الفلاتر.
 *   ملاحظة RTL: في شبكة RTL يقع أول عنصر في DOM أقصى اليمين، لذا يأتي
 *   مكوّن الفلاتر أولاً في DOM (يميناً) وتأتي القائمة بعده (يساراً).
 *   على الشاشات الصغيرة تظهر القائمة أولاً (order) ثم الفلاتر تحتها.
 *
 *  الفلترة عبر معاملات URL (searchParams) — روابط قابلة للمشاركة، وحالة
 *  الخادم مصدر الحقيقة. الصفحة ديناميكية (بسبب قراءة searchParams) فلا
 *  تخزين مؤقت يقديم بيانات قديمة.
 * ============================================================================
 */

import type { Metadata } from 'next';
import Link from 'next/link';

import {
  formatBudgetRange,
  formatDurationDays,
  formatProjectCount,
  parseBudgetParam,
  parseCategoryParam,
  parseSortParam,
  PROJECT_STATUS_BADGE_CLASSES,
  PROJECT_STATUS_LABELS,
} from '@/lib/services/project-meta';
import { listProjects } from '@/lib/services/projects';

import { ProjectFilters } from './filters';

export const metadata: Metadata = {
  title: 'المشاريع',
};

interface ProjectsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** قراءة أول قيمة لمعامل URL (يتحمّل الصيغ المتعددة القيم) */
function firstParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const resolvedSearchParams = await searchParams;

  const filters = {
    category: parseCategoryParam(firstParam(resolvedSearchParams, 'category')),
    budget: parseBudgetParam(firstParam(resolvedSearchParams, 'budget')),
    sort: parseSortParam(firstParam(resolvedSearchParams, 'sort')),
  };

  const projects = await listProjects(filters);
  const hasActiveFilters = Boolean(filters.category || filters.budget);

  return (
    <div className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* ترويسة الصفحة */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              المشاريع
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {formatProjectCount(projects.length)}
              {hasActiveFilters ? ' مطابقة لفلاتر البحث' : ''}
            </p>
          </div>
          <Link
            href="/projects/new"
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            انشر مشروعاً
          </Link>
        </div>

        {/* الشبكة: فلاتر (يمين) + قائمة (يسار) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* الفلاتر — العمود الأيمن */}
          <aside className="order-2 lg:order-1 lg:col-span-4">
            <ProjectFilters
              category={filters.category}
              budget={filters.budget}
              sort={filters.sort}
            />
          </aside>

          {/* قائمة المشاريع — العمود الأيسر */}
          <div className="order-1 lg:order-2 lg:col-span-8">
            {projects.length === 0 ? (
              hasActiveFilters ? (
                /* لا نتائج مطابقة للفلاتر */
                <div className="flex flex-col items-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
                  <p className="text-lg font-medium text-slate-600">
                    لا توجد مشاريع مطابقة لفلاتر البحث
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    جرّب توسيع نطاق الميزانية أو اختيار تصنيف آخر
                  </p>
                  <Link
                    href="/projects"
                    className="mt-6 rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700"
                  >
                    إزالة الفلاتر
                  </Link>
                </div>
              ) : (
                /* لا مشاريع على الإطلاق */
                <div className="flex flex-col items-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
                  <p className="text-lg font-medium text-slate-600">
                    لا توجد مشاريع حالياً
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    كن أول من ينشر مشروعاً على المنصة
                  </p>
                  <Link
                    href="/projects/new"
                    className="mt-6 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    انشر أول مشروع
                  </Link>
                </div>
              )
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <article
                    key={project.id}
                    className="flex flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-bold text-slate-900">
                        {project.title}
                      </h2>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${PROJECT_STATUS_BADGE_CLASSES[project.status]}`}
                      >
                        {PROJECT_STATUS_LABELS[project.status]}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-slate-600">
                      {project.description}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <p className="text-sm text-slate-500">
                        <span dir="ltr" className="font-bold text-slate-800">
                          {formatBudgetRange(project.budgetMin, project.budgetMax)}
                        </span>
                        <span className="mx-2">·</span>
                        {formatDurationDays(project.durationDays)}
                      </p>
                      <Link
                        href={`/projects/${project.id}`}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                      >
                        عرض التفاصيل
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
