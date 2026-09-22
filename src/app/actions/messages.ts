'use server';

import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/db';
import { conversations, messages } from '@/db/schema';
import { getCurrentUser, type AuthActionState } from '@/lib/auth';
import { getOrCreateConversation } from '@/lib/services/messages';

function parseId(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN;
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
}

export async function sendMessageAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState & { conversationId?: number }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, message: 'سجّل دخولك أولاً', redirectTo: '/login' };
  }

  const rawConvId = formData.get('conversationId');
  const rawOtherId = formData.get('otherUserId');
  const rawProjectId = formData.get('projectId');
  const content = (formData.get('content') as string)?.trim();

  if (!content || content.length === 0) {
    return { success: false, message: 'الرسالة فارغة' };
  }
  if (content.length > 2000) {
    return { success: false, message: 'الرسالة طويلة جداً (الحد 2000 حرف)' };
  }

  let conversationId: number | null = rawConvId ? parseId(rawConvId) : null;
  const otherUserId = rawOtherId ? parseId(rawOtherId) : null;
  const projectId = rawProjectId ? parseId(rawProjectId) : null;

  try {
    if (!conversationId) {
      if (!otherUserId) {
        return { success: false, message: 'المحادثة غير محددة' };
      }
      conversationId = await getOrCreateConversation({
        currentUserId: currentUser.id,
        otherUserId,
        projectId,
      });
    }

    // verify membership
    const [conv] = await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.id, conversationId)).limit(1);
    if (!conv) return { success: false, message: 'المحادثة غير موجودة' };

    const [msg] = await db
      .insert(messages)
      .values({
        conversationId,
        senderId: currentUser.id,
        content,
        isRead: false,
      })
      .returning({ id: messages.id });

    await db
      .update(conversations)
      .set({ lastMessageAt: new Date(), updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    revalidatePath('/dashboard/messages');
    revalidatePath(`/dashboard/messages?conversationId=${conversationId}`);

    return { success: true, message: 'تم الإرسال', conversationId, redirectTo: `/dashboard/messages?conversationId=${conversationId}` };
  } catch (e) {
    console.error('sendMessage failed', e);
    return { success: false, message: e instanceof Error ? e.message : 'فشل إرسال الرسالة' };
  }
}

export async function createConversationAction(formData: FormData): Promise<AuthActionState & { conversationId?: number }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, message: 'سجّل دخولك أولاً', redirectTo: '/login' };

  const otherUserId = parseId(formData.get('otherUserId'));
  const projectId = formData.get('projectId') ? parseId(formData.get('projectId')) : null;

  if (!otherUserId) return { success: false, message: 'المستخدم الآخر غير محدد' };

  try {
    const convId = await getOrCreateConversation({
      currentUserId: currentUser.id,
      otherUserId,
      projectId,
    });
    revalidatePath('/dashboard/messages');
    return { success: true, conversationId: convId, redirectTo: `/dashboard/messages?conversationId=${convId}` };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : 'فشل إنشاء المحادثة' };
  }
}

export async function markAsReadAction(conversationId: number): Promise<void> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return;
  await db
    .update(messages)
    .set({ isRead: true })
    .where(sql`${messages.conversationId} = ${conversationId} AND ${messages.senderId} != ${currentUser.id}`);
  revalidatePath('/dashboard/messages');
}
