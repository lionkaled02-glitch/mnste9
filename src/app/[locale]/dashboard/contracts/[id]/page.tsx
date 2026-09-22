/**
 * خدمات — تفاصيل العقد وإدارة الضمان (/dashboard/contracts/[id]) — إعادة تصميم #2386c8
 */

import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getContractById } from '@/app/actions/contracts';
import { EscrowProgress } from '@/components/contracts/escrow-progress';
import { DeliveryForm, RevisionForm, DisputeForm, ReleasePaymentCard } from '@/components/contracts/contract-actions';

interface Props {
  params: Promise<{ id: string }>;
}

function parseId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return id;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cid = parseId(id);
  if (!cid) return { title: 'تفاصيل العقد | خدمات' };
  return { title: `العقد #${cid} | خدمات` };
}

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  active: 'نشط — قيد التنفيذ',
  pending_delivery: 'بانتظار المراجعة',
  completed: 'مكتمل',
  cancelled: 'ملغى',
  disputed: 'متنازع عليه',
};

const STATUS_BADGES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  active: 'bg-[#2386c8]/10 text-[#2386c8] border-[#2386c8]/20',
  pending_delivery: 'bg-purple-50 text-purple-700 border-purple-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  disputed: 'bg-orange-50 text-orange-800 border-orange-200',
};

export default async function ContractDetailsPage({ params }: Props) {
  const { id } = await params;
  const contractId = parseId(id);
  if (!contractId) notFound();

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return (
      <div className="rounded-[14px] border border-gray-200 bg-white p-10 text-center shadow-sm">
        <p className="text-[15px] font-bold text-[#222]">انتهت جلستك</p>
        <Link href="/login" className="mt-5 inline-flex h-10 items-center justify-center rounded-[10px] bg-[#2386c8] px-6 text-[13px] font-bold text-white hover:bg-[#1a6da8]">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  const contract = await getContractById(contractId);
  if (!contract) notFound();

  const isClient = currentUser.id === contract.clientId;
  const isFreelancer = currentUser.id === contract.freelancerId;
  const canRelease = isClient && (contract.status === 'active' || contract.status === 'pending_delivery');
  const canDeliver = isFreelancer && contract.status === 'active';
  const canRequestRevision = isClient && (contract.status === 'active' || contract.status === 'pending_delivery');
  const canDispute = (isClient || isFreelancer) && contract.status !== 'completed' && contract.status !== 'cancelled';

  const commissionRate = Number.parseFloat(contract.commissionRate);

  return (
    <div className="space-y-6 max-w-[960px]">
      <div className="flex items-center gap-2 text-[12px]">
        <Link href="/dashboard/contracts" className="font-bold text-[#888] hover:text-[#222]">العقود</Link>
        <span className="text-gray-300">/</span>
        <span className="font-bold text-[#222]">#{contract.id}</span>
        <span className={`ms-2 rounded-full border px-2.5 py-1 text-[10px] font-bold ${STATUS_BADGES[contract.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
          {STATUS_LABELS[contract.status] ?? contract.status}
        </span>
      </div>

      <div className="rounded-[14px] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[20px] font-extrabold text-[#222]">{contract.projectTitle}</h1>
            <p className="mt-2 text-[12px] text-[#666]">عقد #{contract.id} — مشروع #{contract.projectId} {contract.proposalId ? `— عرض #${contract.proposalId}` : ''} • {formatDate(contract.createdAt)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#f4f5f7] border border-gray-200 px-3 py-1 text-[11px] font-medium text-[#444]">العميل: {contract.clientName}</span>
              <span className="rounded-full bg-[#f4f5f7] border border-gray-200 px-3 py-1 text-[11px] font-medium text-[#444]">المستقل: {contract.freelancerName}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/projects/${contract.projectId}`} className="inline-flex h-9 items-center justify-center rounded-[10px] border border-gray-200 bg-white px-4 text-[12px] font-bold text-[#444] hover:border-[#2386c8] hover:text-[#2386c8]">عرض المشروع</Link>
            <Link href={`/dashboard/messages?projectId=${contract.projectId}`} className="inline-flex h-9 items-center justify-center rounded-[10px] bg-[#222] px-4 text-[12px] font-bold text-white hover:bg-black">محادثة</Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[12px] bg-[#fcfcfc] border border-gray-100 p-4">
            <p className="text-[11px] font-medium text-[#888]">قيمة العقد الإجمالية</p>
            <p dir="ltr" className="mt-2 text-[20px] font-extrabold text-[#222]">{formatCurrency(contract.amount, 'USD')}</p>
            <p className="mt-1 text-[11px] text-[#999]">محجوز منذ {contract.escrowLockedAt ? formatDate(contract.escrowLockedAt) : formatDate(contract.createdAt)}</p>
          </div>
          <div className="rounded-[12px] bg-[#2386c8]/[0.06] border border-[#2386c8]/15 p-4">
            <p className="text-[11px] font-medium text-[#2386c8]">صافي مستحقات المستقل</p>
            <p dir="ltr" className="mt-2 text-[20px] font-extrabold text-[#2386c8]">{formatCurrency(contract.netAmount, 'USD')}</p>
            <p className="mt-1 text-[11px] text-[#666]">بعد عمولة {(commissionRate * 100).toFixed(0)}% = {formatCurrency(contract.commission, 'USD')}</p>
          </div>
          <div className="rounded-[12px] bg-[#fcfcfc] border border-gray-100 p-4">
            <p className="text-[11px] font-medium text-[#888]">حالة العقد</p>
            <p className="mt-2 text-[14px] font-bold text-[#222]">{STATUS_LABELS[contract.status] ?? contract.status}</p>
            <p className="mt-1 text-[11px] text-[#999]">آخر تحديث {formatDate(contract.updatedAt)}</p>
          </div>
        </div>
      </div>

      <EscrowProgress status={contract.status} escrowLockedAt={contract.escrowLockedAt} releasedAt={contract.releasedAt} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-[14px] border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-[14px] font-bold text-[#222]">تفاصيل المشروع</h2>
            <p className="mt-3 whitespace-pre-line rounded-[10px] border border-gray-100 bg-[#fcfcfc] p-4 text-[12.5px] leading-7 text-[#444]">{contract.projectDescription}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[10px] border border-gray-100 bg-[#fcfcfc] p-4">
                <p className="text-[11px] text-[#888]">تاريخ الحجز</p>
                <p className="mt-1 text-[12px] font-bold text-[#222]">{contract.escrowLockedAt ? formatDate(contract.escrowLockedAt) : '—'}</p>
              </div>
              <div className="rounded-[10px] border border-gray-100 bg-[#fcfcfc] p-4">
                <p className="text-[11px] text-[#888]">تاريخ التحرير</p>
                <p className="mt-1 text-[12px] font-bold text-[#222]">{contract.releasedAt ? formatDate(contract.releasedAt) : contract.status === 'completed' ? 'تم التحرير' : 'لم يُحرر بعد'}</p>
              </div>
            </div>
          </section>

          {canDeliver && <DeliveryForm contractId={contract.id} />}
          {canRelease && <ReleasePaymentCard contractId={contract.id} netAmount={contract.netAmount} freelancerName={contract.freelancerName} />}
          {contract.status === 'completed' && (
            <div className="rounded-[12px] border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-[13px] font-bold text-emerald-800">✓ تم إكمال العقد وتحرير الدفعة</p>
              <p className="mt-2 text-[11px] leading-6 text-emerald-700">الصافي {formatCurrency(contract.netAmount, 'USD')} والعمولة {formatCurrency(contract.commission, 'USD')} — المشروع مكتمل.</p>
            </div>
          )}
          {contract.status === 'disputed' && (
            <div className="rounded-[12px] border border-orange-200 bg-orange-50 p-5">
              <p className="text-[13px] font-bold text-orange-900">⚠️ العقد متنازع عليه</p>
              <p className="mt-2 text-[11px] leading-6 text-orange-800">تم فتح نزاع — سيتواصل فريق الدعم مع الطرفين خلال 24 ساعة. يبقى المبلغ محجوزاً حتى الحل.</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <section className="rounded-[14px] border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-[13px] font-bold text-[#222]">إجراءات سريعة</h3>
            <div className="mt-4 space-y-2">
              <Link href={`/dashboard/messages?projectId=${contract.projectId}`} className="flex w-full items-center justify-between rounded-[10px] border border-gray-200 bg-white p-3 text-[12px] font-bold text-[#444] hover:border-[#2386c8] hover:text-[#2386c8]">
                <span>فتح المحادثة</span><span>💬</span>
              </Link>
              <Link href={`/projects/${contract.projectId}`} className="flex w-full items-center justify-between rounded-[10px] border border-gray-200 bg-white p-3 text-[12px] font-bold text-[#444] hover:border-[#2386c8] hover:text-[#2386c8]">
                <span>عرض المشروع</span><span>↗</span>
              </Link>
              <Link href="/dashboard/wallet" className="flex w-full items-center justify-between rounded-[10px] border border-gray-200 bg-white p-3 text-[12px] font-bold text-[#444] hover:border-[#2386c8] hover:text-[#2386c8]">
                <span>المحفظة</span><span>$</span>
              </Link>
            </div>
          </section>
          {canRequestRevision && <RevisionForm contractId={contract.id} />}
          {canDispute && <DisputeForm contractId={contract.id} />}
          <section className="rounded-[14px] border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-[12px] font-bold text-[#222]">معلومات الضمان</h3>
            <ul className="mt-3 space-y-2 text-[11px] leading-5 text-[#666] list-disc ps-4">
              <li>المبلغ محجوز في ضمان خدمات ولا يُدفع إلا بموافقتك</li>
              <li>التسليم يتم عبر زر التسليم مع روابط العمل</li>
              <li>يمكنك طلب تعديلات قبل التحرير</li>
              <li>في حال النزاع يتدخل الدعم خلال 24 ساعة</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
