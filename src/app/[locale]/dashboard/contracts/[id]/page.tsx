/**
 * ============================================================================
 *  mnste9 — تفاصيل العقد (/dashboard/contracts/[id]) — المرحلة 9 (مواصفة دقيقة)
 * ============================================================================
 *  يعرض تفاصيل عقد واحد:
 *   - المشروع + الوصف + الحالة
 *   - العميل والمستقل + المبلغ + نسبة العمولة + العمولة والصافي (مخزنان)
 *   - escrow_locked_at و released_at + التواريخ
 *   - زر «تحرير الدفعة» للعميل عندما يكون العقد نشطاً
 * ============================================================================
 */

import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getContractById } from '@/app/actions/contracts';

import { ReleaseButton } from './release-button';

interface ContractDetailsPageProps {
  params: Promise<{ id: string }>;
}

function parseContractId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return id;
}

export async function generateMetadata({
  params,
}: ContractDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  const contractId = parseContractId(id);
  if (!contractId) return { title: 'تفاصيل العقد' };
  return { title: `العقد #${contractId}` };
}

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

export default async function ContractDetailsPage({
  params,
}: ContractDetailsPageProps) {
  const { id } = await params;
  const contractId = parseContractId(id);
  if (!contractId) notFound();

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-bold text-slate-800">انتهت جلستك</p>
        <p className="mt-2 text-sm text-slate-500">
          سجّل دخولك من جديد لعرض تفاصيل العقد.
        </p>
        <Link
          href={`/login?from=/dashboard/contracts/${contractId}`}
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  const contract = await getContractById(contractId);
  if (!contract) notFound();

  const isClient = currentUser.id === contract.clientId;
  const isFreelancer = currentUser.id === contract.freelancerId;
  const canRelease = isClient && contract.status === 'active';

  const commissionRate = Number.parseFloat(contract.commissionRate);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/dashboard/contracts"
          className="font-semibold text-slate-500 transition hover:text-emerald-700"
        >
          العقود
        </Link>
        <span className="text-slate-300">/</span>
        <span className="font-bold text-slate-900">#{contract.id}</span>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {contract.projectTitle}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              عقد #{contract.id} — مشروع #{contract.projectId}
              {contract.proposalId ? ` — عرض #${contract.proposalId}` : ''}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${CONTRACT_STATUS_BADGES[contract.status] ?? 'bg-slate-100 text-slate-600'}`}
          >
            {CONTRACT_STATUS_LABELS[contract.status] ?? contract.status}
          </span>
        </div>

        <dl className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-4">
            <dt className="text-xs font-medium text-slate-500">المبلغ الإجمالي</dt>
            <dd dir="ltr" className="mt-1 text-xl font-bold text-slate-900">
              {formatCurrency(contract.amount, 'USD')}
            </dd>
            <dd className="mt-1 text-xs text-slate-500">
              محجوز في الضمان منذ{' '}
              {contract.escrowLockedAt
                ? formatDate(contract.escrowLockedAt)
                : formatDate(contract.createdAt)}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <dt className="text-xs font-medium text-slate-500">العمولة والصافي (مخزنان في العقد)</dt>
            <dd className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span>
                نسبة العمولة:{' '}
                <span className="font-bold" dir="ltr">
                  {(commissionRate * 100).toFixed(2)}%
                </span>
              </span>
              <span>
                العمولة:{' '}
                <span className="font-bold" dir="ltr">
                  {formatCurrency(contract.commission, 'USD')}
                </span>
              </span>
              <span>
                الصافي للمستقل:{' '}
                <span className="font-bold text-emerald-700" dir="ltr">
                  {formatCurrency(contract.netAmount, 'USD')}
                </span>
              </span>
            </dd>
            <dd className="mt-2 text-xs leading-6 text-slate-400">
              تُحتسب العمولة من commission_rate المحفوظ في العقد نفسه — لا يُمرَّر
              كمعامل خارجي عند التحرير (القاعدة الذهبية للمرحلة 9). commission =
              amount * rate و net_amount = amount - commission.
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-slate-500">العميل</dt>
            <dd className="mt-1 font-semibold text-slate-800">{contract.clientName}</dd>
            <dd className="mt-0.5 text-xs text-slate-400">معرّف #{contract.clientId}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">المستقل</dt>
            <dd className="mt-1 font-semibold text-slate-800">{contract.freelancerName}</dd>
            <dd className="mt-0.5 text-xs text-slate-400">معرّف #{contract.freelancerId}</dd>
          </div>

          <div>
            <dt className="text-xs font-medium text-slate-500">حالة المشروع</dt>
            <dd className="mt-1 font-semibold text-slate-800">{contract.projectStatus}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">آخر تحديث</dt>
            <dd className="mt-1 text-sm text-slate-700">{formatDate(contract.updatedAt)}</dd>
          </div>

          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-slate-500">وصف المشروع</dt>
            <dd className="mt-2 whitespace-pre-line rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
              {contract.projectDescription}
            </dd>
          </div>
        </dl>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500">تاريخ الحجز (escrow_locked_at)</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {contract.escrowLockedAt ? formatDate(contract.escrowLockedAt) : 'لم يُحجز بعد'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              تم إنشاؤه عند قبول العرض وحجز المبلغ من محفظة العميل.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-medium text-slate-500">تاريخ التحرير (released_at)</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {contract.releasedAt
                ? formatDate(contract.releasedAt)
                : contract.status === 'completed'
                  ? 'تم التحرير'
                  : 'لم يُحرَّر بعد'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              تُحدَّث عند تحرير الدفعة — الصافي يُضاف لرصيد المستقل.
            </p>
          </div>
        </div>

        {canRelease && (
          <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-base font-bold text-amber-900">تحرير الدفعة للمستقل</h2>
            <p className="mt-2 text-sm leading-7 text-amber-800">
              بإقرارك إنجاز العمل، سيُحوَّل الصافي{' '}
              <span dir="ltr" className="font-bold">
                {formatCurrency(contract.netAmount, 'USD')}
              </span>{' '}
              إلى محفظة المستقل{' '}
              <span className="font-bold">{contract.freelancerName}</span> وتُخصم العمولة{' '}
              <span dir="ltr" className="font-bold">
                {formatCurrency(contract.commission, 'USD')}
              </span>{' '}
              للمنصة. لا يمكن التراجع بعد التحرير.
            </p>
            <div className="mt-4">
              <ReleaseButton contractId={contract.id} />
            </div>
          </div>
        )}

        {isFreelancer && contract.status === 'active' && (
          <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm leading-7 text-slate-600">
              هذا العقد نشط والمبلغ محجوز في الضمان. عند إنجازك العمل، تواصل مع
              العميل ليحرر الدفعة — سيُحوَّل الصافي{' '}
              <span dir="ltr" className="font-bold">
                {formatCurrency(contract.netAmount, 'USD')}
              </span>{' '}
              إلى محفظتك بعد خصم العمولة{' '}
              <span dir="ltr" className="font-bold">
                {formatCurrency(contract.commission, 'USD')}
              </span>
              .
            </p>
          </div>
        )}

        {contract.status === 'completed' && (
          <div className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-semibold text-emerald-800">
              ✓ تم إكمال هذا العقد وتحرير الدفعة — المشروع مكتمل.
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              الصافي المحرر للمستقل{' '}
              <span dir="ltr">{formatCurrency(contract.netAmount, 'USD')}</span> والعمولة{' '}
              <span dir="ltr">{formatCurrency(contract.commission, 'USD')}</span>.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/projects/${contract.projectId}`}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700"
        >
          عرض المشروع
        </Link>
        <Link
          href="/dashboard/contracts"
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          العودة إلى العقود
        </Link>
      </div>
    </div>
  );
}
