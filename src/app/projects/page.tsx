/**
 * ============================================================================
 *  خدمات — صفحة المشاريع (/projects) — المرحلة أ
 * ============================================================================
 *  - Header/Footer يأتيان من layout.tsx
 *  - زر مفضلة في كل بطاقة
 * ============================================================================
 */

import type { Metadata } from 'next';
import Link from 'next/link';

import { FavoriteButton } from '@/components/favorite-button';
import { getCurrentUser } from '@/lib/auth';
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

  const [projects, currentUser] = await Promise.all([listProjects(filters), getCurrentUser()]);
  const hasActiveFilters = Boolean(filters.category || filters.budget);
  const isLoggedIn = Boolean(currentUser);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">المشاريع</h1>
          <p className="mt-1 text-sm text-gray-500">
            {formatProjectCount(projects.length)}
            {hasActiveFilters ? ' مطابقة لفلاتر البحث' : ''}
          </p>
        </div>
        <Link
          href="/projects/new"
          className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
        >
          انشر مشروعاً
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="order-2 lg:order-1 lg:col-span-4">
          <ProjectFilters category={filters.category} budget={filters.budget} sort={filters.sort} />
        </aside>

        <div className="order-1 lg:order-2 lg:col-span-8">
          {projects.length === 0 ? (
            hasActiveFilters ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
                <p className="text-lg font-medium text-gray-600">لا توجد مشاريع مطابقة لفلاتر البحث</p>
                <p className="mt-2 text-sm text-gray-400">جرّب توسيع نطاق الميزانية أو اختيار تصنيف آخر</p>
                <Link
                  href="/projects"
                  className="mt-6 rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-emerald-600 hover:text-emerald-700"
                >
                  إزالة الفلاتر
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
                <p className="text-lg font-medium text-gray-600">لا توجد مشاريع حالياً</p>
                <p className="mt-2 text-sm text-gray-400">كن أول من ينشر مشروعاً على المنصة</p>
                <Link
                  href="/projects/new"
                  className="mt-6 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
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
                  className="relative flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow"
                >
                  <div className="absolute left-4 top-4">
                    <FavoriteButton type="project" id={project.id} isLoggedIn={isLoggedIn} />
                  </div>

                  <div className="flex items-start justify-between gap-3 pl-10">
                    <h2 className="text-lg font-bold text-gray-900">{project.title}</h2>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${PROJECT_STATUS_BADGE_CLASSES[project.status]}`}
                    >
                      {PROJECT_STATUS_LABELS[project.status]}
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-gray-600">{project.description}</p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <p className="text-sm text-gray-500">
                      <span dir="ltr" className="font-bold text-gray-800">
                        {formatBudgetRange(project.budgetMin, project.budgetMax)}
                      </span>
                      <span className="mx-2">·</span>
                      {formatDurationDays(project.durationDays)}
                    </p>
                    <Link
                      href={`/projects/${project.id}`}
                      className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
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
  );
}
