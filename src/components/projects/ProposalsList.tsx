/**
 * خدمات — قائمة العروض المقدمة على المشروع
 * - صاحب المشروع يراها كاملة، الزائر يرى ملخص عام
 */

import Link from 'next/link';
import type { ProjectProposalItem } from '@/lib/services/projects';

function formatAmount(amount: string) {
  const n = Number.parseFloat(amount || '0');
  return Number.isInteger(n) ? `${n}$` : `${n.toFixed(2)}$`;
}

function timeAgo(date: Date) {
  try {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'منذ يوم';
    if (days < 7) return `منذ ${days} أيام`;
    return new Date(date).toLocaleDateString('ar-YE');
  } catch {
    return '';
  }
}

export function ProposalsList({
  proposals,
  isOwner,
}: {
  proposals: ProjectProposalItem[];
  isOwner: boolean;
}) {
  if (proposals.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-gray-300 bg-[#fcfcfc] p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f5f7] text-gray-400">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.25h-.75V6.75A2.25 2.25 0 0 0 17.25 4.5H6.75A2.25 2.25 0 0 0 4.5 6.75v1.5h-.75A2.25 2.25 0 0 0 1.5 8.25v7.5A2.25 2.25 0 0 0 3.75 18h16.5A2.25 2.25 0 0 0 22.5 15.75v-7.5A2.25 2.25 0 0 0 20.25 8.25Z" />
          </svg>
        </div>
        <p className="mt-3 text-[13px] font-bold text-[#444]">لا توجد عروض بعد</p>
        <p className="mt-1 text-[12px] text-[#888]">كن أول من يقدم عرضاً على هذا المشروع</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {proposals.map((proposal) => (
        <div
          key={proposal.id}
          className="rounded-[12px] border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2386c8]/10 text-[14px] font-bold text-[#2386c8]">
                {proposal.freelancerName.trim().charAt(0) || 'م'}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-[#222]">{proposal.freelancerName}</span>
                  {proposal.freelancerIsKycVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      موثق
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#888]">
                  <span>{timeAgo(proposal.createdAt)}</span>
                  {proposal.freelancerSkills && (
                    <>
                      <span className="h-3 w-px bg-gray-200" />
                      <span className="line-clamp-1">{proposal.freelancerSkills.slice(0, 60)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="text-left">
              <div className="text-[14px] font-extrabold text-[#222]" dir="ltr">
                {formatAmount(proposal.amount)}
              </div>
              <div className="text-[11px] text-[#888]">{proposal.durationDays} يوم</div>
            </div>
          </div>

          {proposal.comment && (
            <div className="mt-4 rounded-[10px] bg-[#fcfcfc] border border-gray-100 p-3.5">
              <p className="text-[12.5px] leading-6 text-[#444] whitespace-pre-line">
                {isOwner ? proposal.comment : `${proposal.comment.slice(0, 140)}${proposal.comment.length > 140 ? '...' : ''}`}
              </p>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold border ${
                proposal.status === 'pending'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : proposal.status === 'accepted'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              {proposal.status === 'pending' ? 'بانتظار المراجعة' : proposal.status === 'accepted' ? 'مقبول' : proposal.status}
            </span>

            {isOwner ? (
              <div className="flex gap-2">
                <Link
                  href={`/freelancers/${proposal.freelancerId}`}
                  className="inline-flex h-8 items-center justify-center rounded-[8px] border border-gray-200 bg-white px-3 text-[11px] font-bold text-[#444] hover:border-[#2386c8] hover:text-[#2386c8]"
                >
                  الملف الشخصي
                </Link>
                <Link
                  href={`/dashboard/messages?user=${proposal.freelancerId}`}
                  className="inline-flex h-8 items-center justify-center rounded-[8px] bg-[#222] px-3 text-[11px] font-bold text-white hover:bg-black"
                >
                  تواصل
                </Link>
              </div>
            ) : (
              <span className="text-[11px] text-[#999]">العرض مرئي لصاحب المشروع فقط بالتفصيل</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
