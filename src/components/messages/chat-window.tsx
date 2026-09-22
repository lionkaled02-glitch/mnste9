'use client';

import { Link } from '@/i18n/navigation';
import { formatDate } from '@/lib/utils';
import type { ConversationDetails, MessageItem } from '@/lib/services/messages';
import { MessageInput } from './message-input';

interface Props {
  conversation: ConversationDetails | null;
  messages: MessageItem[];
  currentUserId: number;
}

export function ChatWindow({ conversation, messages, currentUserId }: Props) {
  if (!conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2386c8]/10 text-[#2386c8]">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
          </svg>
        </span>
        <p className="mt-4 text-[15px] font-bold text-[#222]">اختر محادثة للبدء</p>
        <p className="mt-2 max-w-sm text-[12px] leading-6 text-[#888]">ستظهر رسائلك مع الطرف الآخر هنا — تواصل مع عملائك ومستقليك بأمان</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex h-[64px] items-center justify-between border-b border-gray-100 bg-white px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2386c8]/10 text-[#2386c8] text-[12px] font-bold">
            {conversation.otherUserName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-[#222]">{conversation.otherUserName}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${conversation.otherUserRole === 'client' ? 'bg-[#2386c8]/10 text-[#2386c8] border-[#2386c8]/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                {conversation.otherUserRole === 'client' ? 'عميل' : 'مستقل'}
              </span>
            </div>
            {conversation.projectTitle && (
              <div className="mt-0.5 text-[11px] text-[#888]">{conversation.projectTitle}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {conversation.projectId && (
            <Link href={`/projects/${conversation.projectId}`} className="inline-flex h-8 items-center justify-center rounded-[8px] border border-gray-200 bg-white px-3 text-[11px] font-bold text-[#444] hover:border-[#2386c8] hover:text-[#2386c8]">
              المشروع
            </Link>
          )}
          {/* زر الانتقال للعقد — نبحث عن عقد مرتبط بالمشروع */}
          <Link href="/dashboard/contracts" className="inline-flex h-8 items-center justify-center rounded-[8px] bg-[#222] px-3 text-[11px] font-bold text-white hover:bg-black">
            العقود
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-[#fcfcfc] p-4 sm:p-5 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-[13px] font-bold text-[#444]">ابدأ المحادثة</p>
            <p className="mt-1 text-[11px] text-[#888]">أرسل أول رسالة لـ {conversation.otherUserName}</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-[14px] px-4 py-2.5 shadow-sm ${isMe ? 'bg-[#2386c8] text-white rounded-br-[4px]' : 'bg-white border border-gray-200 text-[#222] rounded-bl-[4px]'}`}>
                  <p className="whitespace-pre-wrap text-[12.5px] leading-6">{msg.content}</p>
                  <p className={`mt-1 text-[10px] ${isMe ? 'text-white/70' : 'text-[#999]'}`}>{formatDate(msg.createdAt)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 bg-white p-3">
        <MessageInput conversationId={conversation.id} />
      </div>
    </div>
  );
}
