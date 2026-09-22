'use client';

import { Link } from '@/i18n/navigation';
import { formatDate } from '@/lib/utils';
import type { ConversationListItem } from '@/lib/services/messages';

interface Props {
  conversations: ConversationListItem[];
  activeId?: number | null;
  currentUserId: number;
}

export function ConversationList({ conversations, activeId, currentUserId }: Props) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f5f7] text-gray-400">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
          </svg>
        </span>
        <p className="mt-3 text-[13px] font-bold text-[#444]">لا توجد محادثات</p>
        <p className="mt-1 text-[11px] leading-5 text-[#888]">ابدأ محادثة من صفحة مشروع أو ملف مستقل</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map((conv) => {
        const isActive = activeId === conv.id;
        const isFromMe = conv.lastMessageSenderId === currentUserId;
        return (
          <Link
            key={conv.id}
            href={`/dashboard/messages?conversationId=${conv.id}`}
            className={`flex items-start gap-3 p-4 transition hover:bg-[#fcfcfc] ${isActive ? 'bg-[#2386c8]/[0.06] border-s-2 border-s-[#2386c8]' : ''}`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2386c8]/10 text-[#2386c8] text-[13px] font-bold">
              {conv.otherUserName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[13px] font-bold text-[#222]">{conv.otherUserName}</span>
                {conv.unreadCount > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2386c8] px-1.5 text-[10px] font-bold text-white">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                {conv.projectTitle && (
                  <span className="truncate rounded-full bg-[#f4f5f7] border border-gray-200 px-2 py-0.5 text-[10px] text-[#666]">
                    {conv.projectTitle}
                  </span>
                )}
              </div>
              <p className="mt-1.5 line-clamp-1 text-[11px] text-[#888]">
                {isFromMe ? 'أنت: ' : ''}
                {conv.lastMessageContent || '—'}
              </p>
              <p className="mt-1 text-[10px] text-[#999]">{conv.lastMessageAt ? formatDate(conv.lastMessageAt) : formatDate(conv.createdAt)}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
