/**
 * ============================================================================
 *  خدمات — صفحة قائمة المشاريع (/projects) — إعادة تصميم 100% بأسلوب مستقل
 * ============================================================================
 *  - شريط علوي بحث كلمات + فرز (الأحدث، الأعلى ميزانية، الأقل عروضاً)
 *  - Sidebar فلاتر: القسم، الميزانية min/max، حالة المشروع
 *  - بطاقات بيضاء أنيقة: عنوان، ميزانية، وقت، مهارات Badges، نبذة، عروض
 *  - Pagination + Empty State
 *  - Tailwind RTL Mobile First + لون هوية #2386c8
 * ============================================================================
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectFiltersSidebar } from '@/components/projects/ProjectFiltersSidebar';
import { ProjectSearchBar } from '@/components/projects/ProjectSearchBar';
import {
  parseCategoryParam,
  parseBudgetParam,
  parseSortParam,
  parseStatusParam,
  parseQParam,
  parseNumberParam,
  parsePageParam,
} from '@/lib/services/project-meta';
import { listProjectsPaginated } from '@/lib/services/projects';

export const metadata: Metadata = {
  title: 'تصفح المشاريع | خدمات',
  description: 'تصفح أحدث المشاريع المفتوحة وقدم عروضك كمستقل محترف في منصة خدمات',
};

export const dynamic = 'force-dynamic';

interface ProjectsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = searchParams[key];
  return Array.isArray(v) ? v[0] : v;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const resolved = await searchParams;

  const q = parseQParam(firstParam(resolved, 'q'));
  const category = parseCategoryParam(firstParam(resolved, 'category'));
  const budgetLegacy = parseBudgetParam(firstParam(resolved, 'budget'));
  const budgetMin = parseNumberParam(firstParam(resolved, 'budgetMin'));
  const budgetMax = parseNumberParam(firstParam(resolved, 'budgetMax'));
  const status = parseStatusParam(firstParam(resolved, 'status'));
  const sort = parseSortParam(firstParam(resolved, 'sort'));
  const page = parsePageParam(firstParam(resolved, 'page'));

  const filters = {
    q,
    category,
    budget: budgetLegacy,
    budgetMin,
    budgetMax,
    status,
    sort,
    page,
    pageSize: 12,
  };

  const { items: projects, total, totalPages } = await listProjectsPaginated(filters);

  const hasActiveFilters = Boolean(q || category || budgetLegacy || budgetMin !== undefined || budgetMax !== undefined || status);

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      {/* Top header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[22px] font-extrabold tracking-tight text-[#222] sm:text-[26px]">تصفح المشاريع</h1>
              <p className="mt-1.5 text-[13px] text-[#666]">
                {total > 0 ? (
                  <>
                    <span className="font-bold text-[#222]">{total}</span> مشروع متاح
                    {hasActiveFilters ? ' — مطابقة لبحثك' : ''}
                  </>
                ) : (
                  'اعثر على مشروع يناسب مهاراتك وابدأ العمل'
                )}
              </p>
            </div>
            <Link
              href="/projects/new"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] bg-[#2386c8] px-5 text-[13px] font-bold text-white shadow-sm hover:bg-[#1a6da8] sm:self-start"
            >
              <span className="text-[16px] leading-none">+</span> أضف مشروع
            </Link>
          </div>

          <div className="mt-6">
            <ProjectSearchBar initialQ={q} initialSort={sort} />
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap gap-2">
              {q && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2386c8]/10 border border-[#2386c8]/20 px-3 py-1 text-[12px] font-medium text-[#2386c8]">
                  بحث: {q}
                </span>
              )}
              {category && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f5f7] border border-gray-200 px-3 py-1 text-[12px] font-medium text-[#444]">
                  قسم: {category}
                </span>
              )}
              {status && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f5f7] border border-gray-200 px-3 py-1 text-[12px] font-medium text-[#444]">
                  حالة: {status}
                </span>
              )}
              {(budgetMin !== undefined || budgetMax !== undefined) && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f5f7] border border-gray-200 px-3 py-1 text-[12px] font-medium text-[#444]">
                  ميزانية: {budgetMin ?? 0}$ - {budgetMax ?? '∞'}$
                </span>
              )}
              <Link
                href="/projects"
                className="inline-flex items-center rounded-full bg-[#222] px-3 py-1 text-[12px] font-bold text-white hover:bg-black"
              >
                مسح الفلاتر
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Sidebar */}
          <aside className="lg:col-span-3">
            <div className="sticky top-[72px] space-y-4">
              <ProjectFiltersSidebar
                initialCategory={category}
                initialBudgetMin={budgetMin?.toString()}
                initialBudgetMax={budgetMax?.toString()}
                initialStatus={status}
              />

              {/* إحصائيات سريعة */}
              <div className="hidden lg:block rounded-[12px] border border-gray-200 bg-white p-4">
                <h3 className="text-[12px] font-bold text-[#222]">نصائح للعثور على عمل</h3>
                <ul className="mt-3 space-y-2 text-[11px] leading-5 text-[#666] list-disc pr-4">
                  <li>استخدم كلمات مفتاحية دقيقة في البحث</li>
                  <li>فلتر حسب ميزانيتك ومهاراتك</li>
                  <li>قدم عرضاً مخصصاً يبرز خبرتك</li>
                  <li>حافظ على تقييم عالٍ لزيادة فرصك</li>
                </ul>
              </div>
            </div>
          </aside>

          {/* Projects list */}
          <main className="lg:col-span-9">
            {projects.length === 0 ? (
              hasActiveFilters ? (
                <div className="flex flex-col items-center rounded-[14px] border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f5f7] text-gray-400">
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-[14px] font-bold text-[#444]">لا توجد مشاريع مطابقة لفلاتر البحث</h3>
                  <p className="mt-2 max-w-sm text-[12.5px] leading-6 text-[#888]">جرّب توسيع نطاق الميزانية، تغيير القسم، أو إزالة بعض الفلاتر للحصول على نتائج أكثر.</p>
                  <Link
                    href="/projects"
                    className="mt-6 inline-flex h-9 items-center justify-center rounded-[8px] border border-gray-200 bg-white px-5 text-[13px] font-bold text-[#444] hover:border-[#2386c8] hover:text-[#2386c8]"
                  >
                    إزالة الفلاتر
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center rounded-[14px] border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f5f7] text-gray-400">
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-[14px] font-bold text-[#444]">لا توجد مشاريع حالياً</h3>
                  <p className="mt-2 text-[12.5px] text-[#888]">كن أول من ينشر مشروعاً على منصة خدمات</p>
                  <Link
                    href="/projects/new"
                    className="mt-6 inline-flex h-10 items-center justify-center rounded-[10px] bg-[#2386c8] px-6 text-[13px] font-bold text-white hover:bg-[#1a6da8]"
                  >
                    + أضف مشروعك الآن
                  </Link>
                </div>
              )
            ) : (
              <>
                <div className="grid gap-4">
                  {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <div className="flex items-center gap-1 rounded-[10px] border border-gray-200 bg-white p-1 shadow-sm">
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        // عرض صفحات ذكي: أول، أخير، وحول الحالية
                        let pageNum: number;
                        if (totalPages <= 7) pageNum = i + 1;
                        else if (page <= 4) pageNum = i + 1;
                        else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
                        else pageNum = page - 3 + i;

                        const isActive = pageNum === page;
                        const params = new URLSearchParams();
                        if (q) params.set('q', q);
                        if (category) params.set('category', category);
                        if (status) params.set('status', status);
                        if (budgetMin !== undefined) params.set('budgetMin', budgetMin.toString());
                        if (budgetMax !== undefined) params.set('budgetMax', budgetMax.toString());
                        if (sort && sort !== 'newest') params.set('sort', sort);
                        if (pageNum !== 1) params.set('page', pageNum.toString());
                        const href = params.toString() ? `/projects?${params.toString()}` : '/projects';

                        return (
                          <Link
                            key={pageNum}
                            href={href}
                            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-[8px] px-3 text-[13px] font-bold transition ${
                              isActive
                                ? 'bg-[#2386c8] text-white shadow-sm'
                                : 'text-[#555] hover:bg-[#f4f5f7] hover:text-[#222]'
                            }`}
                          >
                            {pageNum}
                          </Link>
                        );
                      })}
                    </div>
                    <span className="text-[12px] text-[#888]">من {totalPages} صفحات • {total} مشروع</span>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
