/**
 * ============================================================================
 *  mnste9 — قائمة العقود (/dashboard/contracts) — المرحلة 9 (مواصفة دقيقة)
 * ============================================================================
 *  تعرض عقود المستخدم الحالي (عميل أو مستقل) مع:
 *   - عنوان المشروع + الطرف الآخر + المبلغ + العمولة + الصافي + الحالة.
 * ============================================================================
 */

import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';

import { getCurrentUser } from '@/lib/auth';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { getMyContracts, type ContractListItem } from '@/app/actions/contracts';

export const metadata: Metadata = {
  title: 'العقود',
};

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  active: 'نشط',
  completed: 'مكتمل',
  cancelled: 'ملغى',
  disputed: 'متنازع عليه',
};

const CONTRACT_STATUS_BADGES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  active: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-slate-800 text-white',
  cancelled: 'bg-red-100 text-red-700',
  disputed: 'bg-orange-100 text-orange-800',
};

function ContractRow({
  contract,
  isClient,
}: {
  contract: ContractListItem;
  isClient: boolean;
}) {
  const commissionRate = Number.parseFloat(contract.commissionRate);

  return (
    <li>
      <Link
        href={`/dashboard/contracts/${contract.id}`}
        className="group -mx-2 flex flex-col gap-3 rounded-lg px-3 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-bold text-slate-800 transition group-hover:text-emerald-700">
              {contract.projectTitle}
            </p>
            <span
              className={cn(
                'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                CONTRACT_STATUS_BADGES[contract.status] ?? 'bg-slate-100 text-slate-600',
              )}
            >
              {CONTRACT_STATUS_LABELS[contract.status] ?? contract.status}
            </span>
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <span>
              {isClient ? 'المستقل:' : 'العميل:'}{' '}
              <span className="font-semibold text-slate-700">
                {isClient ? contract.freelancerName : contract.clientName}
              </span>
            </span>
            <span aria-hidden="true">·</span>
            <span>{formatDate(contract.createdAt)}</span>
            <span aria-hidden="true">·</span>
            <span dir="ltr" className="font-medium">
              {formatCurrency(contract.amount, 'USD')} — عمولة {(commissionRate * 100).toFixed(0)}%
            </span>
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
          <p dir="ltr" className="text-base font-bold text-slate-900">
            {formatCurrency(contract.amount, 'USD')}
          </p>
          <p className="text-xs text-slate-400">
            الصافي{' '}
            <span dir="ltr" className="font-semibold">
              {formatCurrency(contract.netAmount, 'USD')}
            </span>{' '}
            + عمولة{' '}
            <span dir="ltr" className="font-semibold">
              {formatCurrency(contract.commission, 'USD')}
            </span>
          </p>
        </div>
      </Link>
    </li>
  );
}

export default async function ContractsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-bold text-slate-800">انتهت جلستك</p>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          سجّل دخولك من جديد للوصول إلى عقودك.
        </p>
        <Link
          href="/login?from=/dashboard/contracts"
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  const contractsList = await getMyContracts();
  const isClient = currentUser.role === 'client';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">العقود</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isClient
              ? 'العقود التي أنشأتها مع المستقلين — المبالغ محجوزة في الضمان حتى التحرير'
              : 'العقود النشطة والمكتملة — تُحرَّر الدفعات عند إنجاز المشروع'}
          </p>
        </div>
        <Link
          href={isClient ? '/dashboard/projects' : '/dashboard/proposals'}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700"
        >
          {isClient ? 'مشاريعي' : 'عروضي'}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">إجمالي العقود</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{contractsList.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">النشطة</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {contractsList.filter((c) => c.status === 'active').length}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">المكتملة</p>
          <p className="mt-1 text-2xl font-bold text-slate-700">
            {contractsList.filter((c) => c.status === 'completed').length}
          </p>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {contractsList.length === 0 ? (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-slate-300 px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0v12.75m0-12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                />
              </svg>
            </div>
            <p className="mt-4 text-lg font-medium text-slate-600">لا توجد عقود بعد</p>
            <p className="mt-2 max-w-sm text-sm leading-7 text-slate-400">
              {isClient
                ? 'عند قبولك عرضاً من مستقل موثّق سيُنشأ عقد تلقائياً ويُحجز المبلغ في الضمان.'
                : 'عندما يقبل عميل عرضك سيظهر العقد هنا — تابع عروضك في صفحة العروض.'}
            </p>
            <Link
              href={isClient ? '/dashboard/proposals' : '/projects'}
              className="mt-6 rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700"
            >
              {isClient ? 'استعراض العروض المستلمة' : 'تصفح المشاريع'}
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {contractsList.map((contract) => (
              <ContractRow key={contract.id} contract={contract} isClient={isClient} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
