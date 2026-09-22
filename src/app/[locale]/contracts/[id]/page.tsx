/**
 * خدمات — صفحة العقد العامة (/contracts/[id]) — نفس تصميم لوحة التحكم
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
  active: 'نشط',
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

export default async function ContractPublicPage({ params }: Props) {
  const { id } = await params;
  const contractId = parseId(id);
  if (!contractId) notFound();

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return (
      <div className="mx-auto max-w-[960px] rounded-[14px] border border-gray-200 bg-white p-10 text-center shadow-sm">
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

  return (
    <div className="mx-auto max-w-[960px] space-y-6 py-6">
      <div className="flex items-center gap-2 text-[12px]">
        <Link href="/dashboard/contracts" className="font-bold text-[#888] hover:text-[#222]">العقود</Link>
        <span className="text-gray-300">/</span>
        <span className="font-bold text-[#222]">#{contract.id}</span>
        <span className={`ms-2 rounded-full border px-2.5 py-1 text-[10px] font-bold ${STATUS_BADGES[contract.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
          {STATUS_LABELS[contract.status] ?? contract.status}
        </span>
      </div>

      <div className="rounded-[14px] border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-[20px] font-extrabold text-[#222]">{contract.projectTitle}</h1>
        <p className="mt-2 text-[12px] text-[#666]">عقد #{contract.id} • مشروع #{contract.projectId} • {formatDate(contract.createdAt)}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[12px] bg-[#fcfcfc] border border-gray-100 p-4">
            <p className="text-[11px] text-[#888]">الإجمالي</p>
            <p dir="ltr" className="mt-2 text-[18px] font-extrabold text-[#222]">{formatCurrency(contract.amount, 'USD')}</p>
          </div>
          <div className="rounded-[12px] bg-[#2386c8]/[0.06] border border-[#2386c8]/15 p-4">
            <p className="text-[11px] text-[#2386c8]">الصافي للمستقل</p>
            <p dir="ltr" className="mt-2 text-[18px] font-extrabold text-[#2386c8]">{formatCurrency(contract.netAmount, 'USD')}</p>
          </div>
          <div className="rounded-[12px] bg-[#fcfcfc] border border-gray-100 p-4">
            <p className="text-[11px] text-[#888]">الحالة</p>
            <p className="mt-2 text-[13px] font-bold text-[#222]">{STATUS_LABELS[contract.status]}</p>
          </div>
        </div>
      </div>

      <EscrowProgress status={contract.status} escrowLockedAt={contract.escrowLockedAt} releasedAt={contract.releasedAt} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-[14px] border border-gray-200 bg-white p-6 shadow-sm">
            <p className="whitespace-pre-line text-[12.5px] leading-7 text-[#444]">{contract.projectDescription}</p>
          </div>
          {canDeliver && <DeliveryForm contractId={contract.id} />}
          {canRelease && <ReleasePaymentCard contractId={contract.id} netAmount={contract.netAmount} freelancerName={contract.freelancerName} />}
        </div>
        <div className="space-y-4">
          {canRequestRevision && <RevisionForm contractId={contract.id} />}
          {canDispute && <DisputeForm contractId={contract.id} />}
        </div>
      </div>
    </div>
  );
}
