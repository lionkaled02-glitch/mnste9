/**
 * خدمات — قائمة العقود (/dashboard/contracts) — نظام موحد #2386c8
 */

import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';

import { getCurrentUser } from '@/lib/auth';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getMyContracts, type ContractListItem } from '@/app/actions/contracts';

export const metadata: Metadata = {
  title: 'العقود | خدمات',
};

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

function ContractCard({ contract, currentUserId }: { contract: ContractListItem; currentUserId: number }) {
  const isOwner = contract.clientId === currentUserId;
  return (
    <Link
      href={`/dashboard/contracts/${contract.id}`}
      className="group flex flex-col gap-3 rounded-[12px] border border-gray-200 bg-white p-5 shadow-sm transition hover:border-[#2386c8]/30 hover:shadow-[0_4px_12px_rgba(35,134,200,0.08)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[14px] font-bold text-[#222] group-hover:text-[#2386c8]">{contract.projectTitle}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#666]">
            <span className="flex items-center gap-1">
              <span className="h-5 w-5 rounded-full bg-[#f4f5f7] flex items-center justify-center text-[10px] font-bold text-[#666]">{isOwner ? 'م' : 'ع'}</span>
              {isOwner ? contract.freelancerName : contract.clientName}
            </span>
            <span className="h-3 w-px bg-gray-200" />
            <span>{formatDate(contract.createdAt)}</span>
            <span className="h-3 w-px bg-gray-200" />
            <span dir="ltr">{formatCurrency(contract.amount, 'USD')}</span>
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${STATUS_BADGES[contract.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
          {STATUS_LABELS[contract.status] ?? contract.status}
        </span>
      </div>

      <div className="flex items-center justify-between rounded-[10px] bg-[#fcfcfc] border border-gray-100 p-3">
        <div className="text-[11px] text-[#666]">
          الصافي <b dir="ltr" className="text-[#222]">{formatCurrency(contract.netAmount, 'USD')}</b> + عمولة <b dir="ltr">{formatCurrency(contract.commission, 'USD')}</b>
        </div>
        <span className="text-[11px] font-bold text-[#2386c8] group-hover:underline">التفاصيل ←</span>
      </div>
    </Link>
  );
}

export default async function ContractsPage() {
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

  const contractsList = await getMyContracts();

  const active = contractsList.filter((c) => c.status === 'active' || c.status === 'pending_delivery').length;
  const completed = contractsList.filter((c) => c.status === 'completed').length;
  const disputed = contractsList.filter((c) => c.status === 'disputed').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold text-[#222]">العقود</h1>
          <p className="mt-1 text-[13px] text-[#666]">عقودك كمستقل وكصاحب عمل — المبالغ محجوزة في ضمان خدمات حتى التحرير</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/projects" className="inline-flex h-9 items-center justify-center rounded-[10px] border border-gray-200 bg-white px-4 text-[12px] font-bold text-[#444] hover:border-[#222] hover:text-[#222]">
            مشاريعي
          </Link>
          <Link href="/dashboard/messages" className="inline-flex h-9 items-center justify-center rounded-[10px] bg-[#222] px-4 text-[12px] font-bold text-white hover:bg-black">
            الرسائل
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-[12px] border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-medium text-[#888]">إجمالي العقود</p>
          <p className="mt-2 text-[22px] font-extrabold text-[#222]">{contractsList.length}</p>
        </div>
        <div className="rounded-[12px] border border-[#2386c8]/20 bg-[#2386c8]/[0.04] p-5 shadow-sm">
          <p className="text-[11px] font-medium text-[#2386c8]">النشطة</p>
          <p className="mt-2 text-[22px] font-extrabold text-[#2386c8]">{active}</p>
        </div>
        <div className="rounded-[12px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-[11px] font-medium text-emerald-700">المكتملة</p>
          <p className="mt-2 text-[22px] font-extrabold text-emerald-700">{completed}</p>
        </div>
        <div className="rounded-[12px] border border-orange-200 bg-orange-50 p-5 shadow-sm">
          <p className="text-[11px] font-medium text-orange-700">المتنازع عليها</p>
          <p className="mt-2 text-[22px] font-extrabold text-orange-700">{disputed}</p>
        </div>
      </div>

      {contractsList.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f5f7] text-gray-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0v12.75m0-12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <p className="mt-4 text-[14px] font-bold text-[#444]">لا توجد عقود بعد</p>
          <p className="mt-2 text-[12px] leading-6 text-[#888] max-w-[380px] mx-auto">عند قبولك عرضاً على أحد مشاريعك أو قبول عميل لعرضك سيُنشأ عقد تلقائياً ويُحجز المبلغ في الضمان.</p>
          <Link href="/dashboard/proposals" className="mt-6 inline-flex h-10 items-center justify-center rounded-[10px] border border-gray-200 bg-white px-5 text-[12px] font-bold text-[#444] hover:border-[#2386c8] hover:text-[#2386c8]">
            استعراض العروض
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {contractsList.map((c) => (
            <ContractCard key={c.id} contract={c} currentUserId={currentUser.id} />
          ))}
        </div>
      )}
    </div>
  );
}
