/**
 * ============================================================================
 *  mnste9 — مشاريعي (/dashboard/projects)
 * ============================================================================
 *  قائمة المشاريع حسب الدور (مواصفة المرحلة):
 *   - صاحب العمل: المشاريع التي نشرها (مع عدد العروض المستلمة لكل مشروع).
 *   - المستقل: المشاريع التي قدّم عليها عرضاً (مع حالة عرضه ومبلغه).
 *
 *  التبويبات (‎?status=‎ كروابط تعمل بلا JavaScript):
 *   الكل | العروض (المفتوحة لاستقبال العروض) | الجارية | المكتملة
 *   — والملغاة تظهر ضمن «الكل» فقط. حالة الفراغ: «لا توجد مشاريع حالياً».
 *
 *  الحماية: middleware + فحص إضافي عبر getCurrentUser (دفاع متعدد الطبقات).
 * ============================================================================
 */

import type { Metadata } from 'next';
import Link from 'next/link';

import { getCurrentUser } from '@/lib/auth';
import {
  deriveCategoryLabel,
  formatBudgetRange,
  formatDurationDays,
  formatProposalCount,
  PROJECT_STATUS_BADGE_CLASSES,
  PROJECT_STATUS_LABELS,
} from '@/lib/services/project-meta';
import {
  getDashboardProjectCounts,
  getDashboardProjects,
  parseProjectTab,
  type DashboardProjectItem,
} from '@/lib/services/dashboard-lists';
import { cn, formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'مشاريعي',
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

/** التبويبات — القيم في ?status= */
const TABS = [
  { key: 'all', label: 'الكل' },
  { key: 'open', label: 'العروض' },
  { key: 'in_progress', label: 'الجارية' },
  { key: 'completed', label: 'المكتملة' },
] as const;

/** شارة حالة عرض المستقل على المشروع (عرض «مشاريعي» للمستقل) */
const PROPOSAL_STATUS_BADGES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-700',
  withdrawn: 'bg-slate-100 text-slate-600',
};

const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  pending: 'عرضك قيد الانتظار',
  accepted: 'عرضك مقبول',
  rejected: 'عرضك مرفوض',
  withdrawn: 'سحبت عرضك',
};

function ProjectRow({
  project,
  isClient,
}: {
  project: DashboardProjectItem;
  isClient: boolean;
}) {
  const category = deriveCategoryLabel(project.description);

  return (
    <li>
      <Link
        href={`/projects/${project.id}`}
        className="group -mx-2 flex flex-col gap-2 rounded-lg px-2 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-800 transition group-hover:text-emerald-700">
            {project.title}
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <span dir="ltr" className="font-semibold text-slate-700">
              {formatBudgetRange(project.budgetMin, project.budgetMax)}
            </span>
            <span aria-hidden="true">·</span>
            <span>{formatDurationDays(project.durationDays)}</span>
            <span aria-hidden="true">·</span>
            <span>{formatDate(project.createdAt)}</span>
            {category && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                {category}
              </span>
            )}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {isClient ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {formatProposalCount(project.proposalsCount)}
            </span>
          ) : project.myProposalStatus ? (
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-semibold',
                PROPOSAL_STATUS_BADGES[project.myProposalStatus] ??
                  'bg-slate-100 text-slate-600',
              )}
            >
              {PROPOSAL_STATUS_LABELS[project.myProposalStatus] ??
                project.myProposalStatus}
            </span>
          ) : null}
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PROJECT_STATUS_BADGE_CLASSES[project.status]}`}
          >
            {PROJECT_STATUS_LABELS[project.status]}
          </span>
        </div>
      </Link>
    </li>
  );
}

export default async function DashboardProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-bold text-slate-800">انتهت جلستك</p>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          سجّل دخولك من جديد للوصول إلى مشاريعك.
        </p>
        <Link
          href="/login?from=/dashboard/projects"
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  const activeTab = parseProjectTab(firstParam(await searchParams, 'status'));
  const isClient = currentUser.role === 'client';

  const [projectsList, counts] = await Promise.all([
    getDashboardProjects(currentUser.id, currentUser.role, activeTab),
    getDashboardProjectCounts(currentUser.id, currentUser.role),
  ]);

  return (
    <div className="space-y-6">
      {/* الترويسة */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            مشاريعي
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isClient
              ? 'المشاريع التي نشرتها وعدد العروض الواردة عليها'
              : 'المشاريع التي قدّمت عليها عروضاً وحالة كل عرض'}
          </p>
        </div>
        {isClient && (
          <Link
            href="/projects/new"
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            انشر مشروعاً جديداً
          </Link>
        )}
      </div>

      {/* التبويبات — روابط حقيقية عبر ?status= */}
      <nav
        aria-label="تصفية المشاريع"
        className="flex gap-1.5 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count =
            tab.key === 'all'
              ? counts.all
              : counts[tab.key as keyof typeof counts];
          return (
            <Link
              key={tab.key}
              href={
                tab.key === 'all'
                  ? '/dashboard/projects'
                  : `/dashboard/projects?status=${tab.key}`
              }
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-semibold transition',
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-xs',
                  isActive ? 'bg-emerald-500/30 text-white' : 'bg-slate-100 text-slate-500',
                )}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* القائمة / حالة الفراغ */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {projectsList.length === 0 ? (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-slate-300 px-6 py-16 text-center">
            <p className="text-lg font-medium text-slate-600">
              لا توجد مشاريع حالياً
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {isClient
                ? 'انشر مشروعك الأول ليبدأ المستقلون بتقديم عروضهم.'
                : 'تصفّح المشاريع المفتوحة وقدّم عرضك ليظهر هنا.'}
            </p>
            <Link
              href={isClient ? '/projects/new' : '/projects'}
              className="mt-6 rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700"
            >
              {isClient ? 'انشر مشروعاً' : 'تصفح المشاريع'}
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {projectsList.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                isClient={isClient}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
