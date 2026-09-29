'use client';

import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';

import { sendMessageAction } from '@/app/actions/messages';
import { Link } from '@/i18n/navigation';
import type { ConversationDetails, MessageItem } from '@/lib/services/messages';
import { MessageBubble } from './message-bubble';

interface Props {
  conversation: ConversationDetails | null;
  messages: MessageItem[];
  currentUserId: number;
}

type ChatMessage = Omit<MessageItem, 'createdAt'> & {
  createdAt: Date | string;
  pending?: boolean;
};

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const map = new Map<number, ChatMessage>();
  for (const message of current) {
    if (message.id > 0) map.set(message.id, message);
  }
  for (const message of incoming) {
    map.set(message.id, message);
  }

  const pending = current.filter((message) => message.pending && message.id < 0);
  return [...Array.from(map.values()), ...pending].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return aTime - bTime;
  });
}

function normalizeMessage(message: MessageItem | ChatMessage): ChatMessage {
  return {
    ...message,
    createdAt: message.createdAt instanceof Date ? message.createdAt.toISOString() : message.createdAt,
  };
}

function isMessageLike(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false;
  const maybe = value as Partial<ChatMessage>;
  return typeof maybe.id === 'number' && typeof maybe.senderId === 'number' && typeof maybe.content === 'string';
}

export function ChatWindow({ conversation, messages, currentUserId }: Props) {
  const t = useTranslations('messages');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => messages.map(normalizeMessage));
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const lastMessageId = useMemo(() => {
    return chatMessages.reduce((max, message) => (message.id > max ? message.id : max), 0);
  }, [chatMessages]);

  useEffect(() => {
    setChatMessages(messages.map(normalizeMessage));
    setContent('');
    setError(null);
  }, [conversation?.id, messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatMessages.length, conversation?.id]);

  useEffect(() => {
    if (!conversation) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const response = await fetch(`/api/messages?conversationId=${conversation.id}&since=${lastMessageId}`, {
          cache: 'no-store',
        });
        if (!response.ok) return;
        const data = await response.json();
        const nextMessages = Array.isArray(data.messages) ? data.messages.map(normalizeMessage) : [];
        if (!cancelled && nextMessages.length > 0) {
          setChatMessages((current) => mergeMessages(current, nextMessages));
        }
      } catch (pollError) {
        console.error('messages polling failed', pollError);
      }
    };

    const interval = window.setInterval(poll, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [conversation, lastMessageId]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!conversation || !content.trim()) return;

    const text = content.trim();
    const tempId = -Date.now();
    const optimisticMessage: ChatMessage = {
      id: tempId,
      conversationId: conversation.id,
      senderId: currentUserId,
      senderName: '',
      content: text,
      isRead: false,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setChatMessages((current) => [...current, optimisticMessage]);
    setContent('');
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set('conversationId', String(conversation.id));
      formData.set('content', text);

      const result = await sendMessageAction({ success: false }, formData);

      if (!result.success) {
        setChatMessages((current) => current.filter((message) => message.id !== tempId));
        setError(typeof result.message === 'string' ? result.message : 'فشل إرسال الرسالة');
        setContent(text);
        return;
      }

      if (isMessageLike(result.message)) {
        setChatMessages((current) => {
          const withoutTemp = current.filter((message) => message.id !== tempId);
          return mergeMessages(withoutTemp, [normalizeMessage(result.message as ChatMessage)]);
        });
      } else {
        setChatMessages((current) => current.map((message) => (
          message.id === tempId ? { ...message, pending: false } : message
        )));
      }
    });
  };

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
      <div className="flex h-[64px] items-center justify-between border-b border-gray-100 bg-white px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2386c8]/10 text-[12px] font-bold text-[#2386c8]">
            {conversation.otherUserName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-[#222]">{conversation.otherUserName}</span>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${conversation.otherUserRole === 'client' ? 'border-[#2386c8]/20 bg-[#2386c8]/10 text-[#2386c8]' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
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
          <Link href="/dashboard/contracts" className="inline-flex h-8 items-center justify-center rounded-[8px] bg-[#222] px-3 text-[11px] font-bold text-white hover:bg-black">
            العقود
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#fcfcfc] p-4 sm:p-5">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-[13px] font-bold text-[#444]">ابدأ المحادثة</p>
            <p className="mt-1 text-[11px] text-[#888]">أرسل أول رسالة لـ {conversation.otherUserName}</p>
          </div>
        ) : (
          chatMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isMe={message.senderId === currentUserId}
              pending={message.pending}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-100 bg-white p-3">
        <form ref={formRef} onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="relative flex-1">
            {error && <p className="absolute -top-6 start-0 text-[11px] text-red-600">{error}</p>}
            <textarea
              name="content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  formRef.current?.requestSubmit();
                }
              }}
              placeholder={t('sendPlaceholder')}
              rows={1}
              maxLength={2000}
              required
              disabled={isPending}
              className="max-h-[120px] min-h-[44px] w-full resize-none rounded-[12px] border border-gray-200 bg-[#f4f5f7] px-4 py-3 text-[13px] text-[#222] outline-none placeholder:text-[#999] focus:border-[#2386c8] focus:bg-white focus:ring-2 focus:ring-[#2386c8]/15 disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || !content.trim()}
            className="inline-flex h-[44px] shrink-0 items-center justify-center rounded-[12px] bg-[#2386c8] px-4 text-[12px] font-bold text-white shadow-sm transition hover:bg-[#1a6da8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? t('sending') : t('send')}
          </button>
        </form>
      </div>
    </div>
  );
}
