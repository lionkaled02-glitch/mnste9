/**
 * خدمات — الرسائل (/dashboard/messages) — إعادة تصميم #2386c8
 * - Split View: قائمة محادثات + صندوق رسائل
 * - اسم الطرف، آخر رسالة، شارة غير مقروءة
 * - رأس مع اسم الطرف + رابط المشروع + زر العقد
 * - صندوق إرسال مع Enter سريع
 */

import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';

import { getCurrentUser } from '@/lib/auth';
import { getConversations, getConversationById, getMessages } from '@/lib/services/messages';
import { ConversationList } from '@/components/messages/conversation-list';
import { ChatWindow } from '@/components/messages/chat-window';

export const metadata: Metadata = {
  title: 'الرسائل | خدمات',
};

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

export default async function MessagesPage({ searchParams }: Props) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <div className="rounded-[14px] border border-gray-200 bg-white p-10 text-center shadow-sm">
        <p className="text-[15px] font-bold text-[#222]">انتهت جلستك</p>
        <p className="mt-2 text-[13px] text-[#666]">سجّل دخولك للوصول إلى رسائلك</p>
        <Link href="/login" className="mt-5 inline-flex h-10 items-center justify-center rounded-[10px] bg-[#2386c8] px-6 text-[13px] font-bold text-white hover:bg-[#1a6da8]">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  const resolved = await searchParams;
  const rawId = firstParam(resolved, 'conversationId') || firstParam(resolved, 'id');
  const activeId = rawId ? Number(rawId) : null;
  const validActiveId = activeId && Number.isSafeInteger(activeId) && activeId > 0 ? activeId : null;

  const conversations = await getConversations(currentUser.id);

  let activeConversation = null;
  let activeMessages: Awaited<ReturnType<typeof getMessages>> = [];

  if (validActiveId) {
    activeConversation = await getConversationById(validActiveId, currentUser.id);
    if (activeConversation) {
      activeMessages = await getMessages(validActiveId, currentUser.id, 100);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold text-[#222]">الرسائل</h1>
          <p className="mt-1 text-[13px] text-[#666]">تواصل مع العملاء والمستقلين في مكان واحد — محمي بضمان خدمات</p>
        </div>
        <Link href="/dashboard/contracts" className="hidden sm:inline-flex h-9 items-center justify-center rounded-[10px] border border-gray-200 bg-white px-4 text-[12px] font-bold text-[#444] hover:border-[#222] hover:text-[#222]">
          العقود
        </Link>
      </div>

      <div className="grid h-[680px] grid-cols-1 overflow-hidden rounded-[14px] border border-gray-200 bg-white shadow-sm lg:grid-cols-[340px_1fr]">
        {/* قائمة المحادثات — يمين */}
        <aside className="flex flex-col border-b border-gray-200 bg-white lg:border-b-0 lg:border-s lg:border-e-0 lg:order-1 overflow-hidden">
          <div className="flex h-[64px] items-center justify-between border-b border-gray-100 px-4">
            <h2 className="text-[13px] font-bold text-[#222]">المحادثات ({conversations.length})</h2>
            <span className="rounded-full bg-[#f4f5f7] px-2.5 py-1 text-[10px] font-bold text-[#666]">
              {conversations.reduce((a, c) => a + c.unreadCount, 0)} غير مقروءة
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <ConversationList conversations={conversations} activeId={validActiveId} currentUserId={currentUser.id} />
          </div>

          <div className="border-t border-gray-100 bg-[#fcfcfc] p-3 text-[11px] leading-5 text-[#888]">
            💡 نصيحة: ابدأ محادثة من صفحة المشروع أو من قبول العرض — تُحفظ جميع الرسائل بأمان
          </div>
        </aside>

        {/* نافذة الدردشة — يسار */}
        <section className="flex flex-col overflow-hidden lg:order-2 min-h-[400px]">
          <ChatWindow conversation={activeConversation} messages={activeMessages} currentUserId={currentUser.id} />
        </section>
      </div>

      {validActiveId && (
        <div className="lg:hidden">
          <Link href="/dashboard/messages" className="inline-flex h-9 items-center justify-center rounded-[10px] border border-gray-200 bg-white px-4 text-[12px] font-bold text-[#444]">
            ← العودة للقائمة
          </Link>
        </div>
      )}
    </div>
  );
}
