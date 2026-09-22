/**
 * ============================================================================
 *  mnste9 — صفحة تفاصيل المشروع (/projects/[id]) — المرحلة 10 محسّنة
 * ============================================================================
 *  - يستخدم SiteHeader/Footer
 *  - نفس التفاصيل السابقة
 * ============================================================================
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth';
import {
  deriveCategoryLabel,
  formatBudgetRange,
  formatDurationDays,
  formatProposalCount,
  PROJECT_STATUS_BADGE_CLASSES,
  PROJECT_STATUS_LABELS,
  stripCategoryTag,
} from '@/lib/services/project-meta';
import { getProjectWithClient, hasUserProposed } from '@/lib/services/projects';
import { formatDate } from '@/lib/utils';

import { ProposalForm } from '../proposal-form';

interface ProjectDetailsPageProps {
  params: Promise<{ id: string }>;
}

function parseProjectId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return id;
}

export async function generateMetadata({ params }: ProjectDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  const projectId = parseProjectId(id);
  if (!projectId) return { title: 'تفاصيل المشروع' };

  const project = await getProjectWithClient(projectId);
  return { title: project ? project.title : 'تفاصيل المشروع' };
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-600">
      {children}
    </div>
  );
}

export default async function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const { id } = await params;
  const projectId = parseProjectId(id);
  if (!projectId) notFound();

  const project = await getProjectWithClient(projectId);
  if (!project) notFound();

  const currentUser = await getCurrentUser();
  const alreadyProposed =
    currentUser?.role === 'freelancer' ? await hasUserProposed(project.id, currentUser.id) : false;

  const categoryLabel = deriveCategoryLabel(`${project.title} ${project.description}`);
  const clientInitial = project.clientName.trim().charAt(0) || 'م';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      

      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{project.title}</h1>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${PROJECT_STATUS_BADGE_CLASSES[project.status]}`}
            >
              {PROJECT_STATUS_LABELS[project.status]}
            </span>
          </div>

          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-600">
            <div>
              <dt className="inline font-medium text-slate-500">الميزانية: </dt>
              <dd dir="ltr" className="inline font-bold text-slate-900">
                {formatBudgetRange(project.budgetMin, project.budgetMax)}
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-slate-500">المدة: </dt>
              <dd className="inline font-semibold text-slate-800">{formatDurationDays(project.durationDays)}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-slate-500">تاريخ النشر: </dt>
              <dd className="inline font-semibold text-slate-800">{formatDate(project.createdAt)}</dd>
            </div>
            {categoryLabel && (
              <div>
                <dt className="inline font-medium text-slate-500">التصنيف: </dt>
                <dd className="inline font-semibold text-slate-800">{categoryLabel}</dd>
              </div>
            )}
            <div>
              <dt className="inline font-medium text-slate-500">العروض: </dt>
              <dd className="inline font-semibold text-slate-800">{formatProposalCount(project.proposalsCount)}</dd>
            </div>
          </dl>

          <hr className="my-6 border-slate-100" />

          <h2 className="text-lg font-bold text-slate-900">وصف المشروع</h2>
          <div className="mt-3 whitespace-pre-line text-base leading-8 text-slate-700">
            {stripCategoryTag(project.description)}
          </div>
        </article>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">عن العميل</h2>
          <div className="mt-4 flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
              {clientInitial}
            </span>
            <div>
              <p className="font-bold text-slate-900">{project.clientName}</p>
              <p className="mt-0.5 text-sm text-slate-500">عضو منذ {formatDate(project.clientCreatedAt)}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">التقييم: لا تقييمات بعد</span>
            <span
              className={
                project.clientIsKycVerified
                  ? 'rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800'
                  : 'rounded-full bg-slate-100 px-3 py-1 text-slate-600'
              }
            >
              {project.clientIsKycVerified ? 'هوية موثّقة (KYC) ✓' : 'الهوية غير موثّقة بعد'}
            </span>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">تقديم عرض</h2>
          <div className="mt-4">
            {!currentUser ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-8 text-center">
                <p className="font-medium text-slate-700">سجل دخولك لتقديم عرض</p>
                <Link
                  href={`/login?from=/projects/${project.id}`}
                  className="mt-4 inline-block rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  تسجيل الدخول
                </Link>
              </div>
            ) : currentUser.id === project.clientId ? (
              <Notice>هذا مشروعك المنشور — ستظهر عروض المستقلين عليه في لوحة التحكم.</Notice>
            ) : project.status !== 'open' ? (
              <Notice>هذا المشروع مغلق لتلقي العروض.</Notice>
            ) : currentUser.role === 'freelancer' ? (
              alreadyProposed ? (
                <Notice>لقد قدّمت عرضك على هذا المشروع بالفعل.</Notice>
              ) : (
                <ProposalForm projectId={project.id} />
              )
            ) : (
              <Notice>تقديم العروض متاح للمستقلين فقط.</Notice>
            )}
          </div>
        </section>

        <div className="mt-8">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12l-7.5 7.5M21 12H3" />
            </svg>
            العودة إلى المشاريع
          </Link>
        </div>
      </div>

      
    </div>
  );
}
