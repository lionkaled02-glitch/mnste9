/**
 * ============================================================================
 *  mnste9 — عروضي (/dashboard/proposals)
 * ============================================================================
 *  قائمة العروض حسب الدور (مواصفة المرحلة):
 *   - المستقل: العروض التي قدّمها (مع صاحب كل مشروع).
 *   - صاحب العمل: العروض المقدَّمة على مشاريعه (مع اسم المستقل صاحب
 *     كل عرض وزر الوصول إلى ملفه).
 *
 *  التبويبات (‎?status=‎ كروابط تعمل بلا JavaScript):
 *   الكل | قيد الانتظار | مقبولة | مرفوضة
 *   — والمسحوبة تظهر ضمن «الكل» فقط.
 *
 *  الحماية: middleware + فحص إضافي عبر getCurrentUser (دفاع متعدد الطبقات).
 * ============================================================================
 */

import type { Metadata } from 'next';
import Link from 'next/link';

import { getCurrentUser } from '@/lib/auth';
import {
  formatBudgetRange,
  formatDurationDays,
} from '@/lib/services/project-meta';
import {
  getDashboardProposalCounts,
  getDashboardProposals,
  parseProposalTab,
  type DashboardProposalItem,
} from '@/lib/services/dashboard-lists';
import { formatCurrency, cn, formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'العروض',
};

interface ProposalsPageProps {
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
  { key: 'pending', label: 'قيد الانتظار' },
  { key: 'accepted', label: 'مقبولة' },
  { key: 'rejected', label: 'مرفوضة' },
] as const;

const PROPOSAL_STATUS_BADGES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-700',
  withdrawn: 'bg-slate-100 text-slate-600',
};

const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  accepted: 'مقبول',
  rejected: 'مرفوض',
  withdrawn: 'مسحوب',
};

function ProposalRow({
  proposal,
  isClient,
}: {
  proposal: DashboardProposalItem;
  isClient: boolean;
}) {
  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/projects/${proposal.projectId}`}
            className="truncate font-semibold text-slate-800 transition hover:text-emerald-700 hover:underline"
          >
            {proposal.projectTitle}
          </Link>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${PROPOSAL_STATUS_BADGES[proposal.status] ?? 'bg-slate-100 text-slate-600'}`}
          >
            {PROPOSAL_STATUS_LABELS[proposal.status] ?? proposal.status}
          </span>
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          {isClient ? (
            <>
              <span>من المستقل:</span>
              <Link
                href={`/freelancers/${proposal.counterpartId}`}
                className="font-semibold text-slate-700 hover:text-emerald-700 hover:underline"
              >
                {proposal.counterpartName}
              </Link>
              {proposal.counterpartKycVerified && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
                  KYC ✓
                </span>
              )}
            </>
          ) : (
            <span>
              لصاحب العمل:{' '}
              <span className="font-semibold text-slate-700">
                {proposal.counterpartName}
              </span>
            </span>
          )}
          <span aria-hidden="true">·</span>
          <span dir="ltr">
            {formatBudgetRange(proposal.budgetMin, proposal.budgetMax)}
          </span>
          <span aria-hidden="true">·</span>
          <span>{formatDurationDays(proposal.durationDays)}</span>
          <span aria-hidden="true">·</span>
          <span>{formatDate(proposal.createdAt)}</span>
        </p>
      </div>

      <div className="shrink-0 sm:text-right">
        <p dir="ltr" className="text-base font-bold text-slate-900">
          {formatCurrency(proposal.amount, 'USD')}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">مبلغ العرض</p>
      </div>
    </li>
  );
}

export default async function DashboardProposalsPage({
  searchParams,
}: ProposalsPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-bold text-slate-800">انتهت جلستك</p>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          سجّل دخولك من جديد للوصول إلى عروضك.
        </p>
        <Link
          href="/login?from=/dashboard/proposals"
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  const activeTab = parseProposalTab(firstParam(await searchParams, 'status'));
  const isClient = currentUser.role === 'client';

  const [proposalsList, counts] = await Promise.all([
    getDashboardProposals(currentUser.id, currentUser.role, activeTab),
    getDashboardProposalCounts(currentUser.id, currentUser.role),
  ]);

  return (
    <div className="space-y-6">
      {/* الترويسة */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {isClient ? 'العروض المستلمة' : 'عروضي المقدمة'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isClient
            ? 'العروض التي قدّمها المستقلون على مشاريعك'
            : 'العروض التي قدّمتها على مشاريع المنصة وحالة كل منها'}
        </p>
      </div>

      {/* التبويبات — روابط حقيقية عبر ?status= */}
      <nav
        aria-label="تصفية العروض"
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
                  ? '/dashboard/proposals'
                  : `/dashboard/proposals?status=${tab.key}`
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
        {proposalsList.length === 0 ? (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-slate-300 px-6 py-16 text-center">
            <p className="text-lg font-medium text-slate-600">
              لا توجد عروض حالياً
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {isClient
                ? 'ستظهر هنا العروض التي يقدّمها المستقلون على مشاريعك.'
                : 'قدّم عرضك على المشاريع المفتوحة ليظهر هنا.'}
            </p>
            <Link
              href={isClient ? '/dashboard/projects' : '/projects'}
              className="mt-6 rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700"
            >
              {isClient ? 'استعرض مشاريعي' : 'تصفح المشاريع'}
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {proposalsList.map((proposal) => (
              <ProposalRow
                key={proposal.id}
                proposal={proposal}
                isClient={isClient}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
