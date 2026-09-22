/**
 * خدمات — نظام المحادثات (conversations + messages)
 * - جداول: conversations, messages, users, projects
 * - لا تعديل migrations/schema
 */

import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';

import { db } from '@/db';
import { conversations, messages, projects, users } from '@/db/schema';

export interface ConversationListItem {
  id: number;
  otherUserId: number;
  otherUserName: string;
  otherUserRole: string;
  projectId: number | null;
  projectTitle: string | null;
  lastMessageAt: Date | null;
  lastMessageContent: string | null;
  lastMessageSenderId: number | null;
  unreadCount: number;
  createdAt: Date;
}

export interface MessageItem {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

export interface ConversationDetails {
  id: number;
  participant1Id: number;
  participant2Id: number;
  otherUserId: number;
  otherUserName: string;
  otherUserRole: string;
  projectId: number | null;
  projectTitle: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * جلب محادثات المستخدم الحالي مع آخر رسالة وعدد غير المقروءة
 */
export async function getConversations(userId: number): Promise<ConversationListItem[]> {
  const convRows = await db
    .select({
      id: conversations.id,
      participant1Id: conversations.participant1Id,
      participant2Id: conversations.participant2Id,
      projectId: conversations.projectId,
      lastMessageAt: conversations.lastMessageAt,
      createdAt: conversations.createdAt,
      projectTitle: projects.title,
    })
    .from(conversations)
    .leftJoin(projects, eq(conversations.projectId, projects.id))
    .where(or(eq(conversations.participant1Id, userId), eq(conversations.participant2Id, userId)))
    .orderBy(desc(conversations.lastMessageAt), desc(conversations.updatedAt))
    .limit(100);

  if (convRows.length === 0) return [];

  const otherIds = convRows.map((c) => (c.participant1Id === userId ? c.participant2Id : c.participant1Id));
  const convIds = convRows.map((c) => c.id);

  const [userRows, lastMessages, unreadRows] = await Promise.all([
    db.select({ id: users.id, name: users.name, role: users.role }).from(users).where(inArray(users.id, otherIds)),
    db
      .select({
        conversationId: messages.conversationId,
        content: messages.content,
        senderId: messages.senderId,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(inArray(messages.conversationId, convIds))
      .orderBy(desc(messages.createdAt)),
    db
      .select({
        conversationId: messages.conversationId,
        count: sql<number>`count(*)::int`,
      })
      .from(messages)
      .where(and(inArray(messages.conversationId, convIds), eq(messages.isRead, false), sql`${messages.senderId} != ${userId}`))
      .groupBy(messages.conversationId),
  ]);

  const usersMap = new Map(userRows.map((u) => [u.id, u]));
  const lastMap = new Map<number, { content: string; senderId: number }>();
  for (const m of lastMessages) {
    if (!lastMap.has(m.conversationId)) {
      lastMap.set(m.conversationId, { content: m.content, senderId: m.senderId });
    }
  }
  const unreadMap = new Map(unreadRows.map((r) => [r.conversationId, r.count]));

  return convRows.map((c) => {
    const otherId = c.participant1Id === userId ? c.participant2Id : c.participant1Id;
    const other = usersMap.get(otherId);
    const last = lastMap.get(c.id);
    return {
      id: c.id,
      otherUserId: otherId,
      otherUserName: other?.name ?? 'مستخدم',
      otherUserRole: other?.role ?? 'client',
      projectId: c.projectId,
      projectTitle: c.projectTitle,
      lastMessageAt: c.lastMessageAt,
      lastMessageContent: last?.content ?? null,
      lastMessageSenderId: last?.senderId ?? null,
      unreadCount: unreadMap.get(c.id) ?? 0,
      createdAt: c.createdAt,
    };
  });
}

export async function getConversationById(conversationId: number, userId: number): Promise<ConversationDetails | null> {
  const [row] = await db
    .select({
      id: conversations.id,
      participant1Id: conversations.participant1Id,
      participant2Id: conversations.participant2Id,
      projectId: conversations.projectId,
      projectTitle: projects.title,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .leftJoin(projects, eq(conversations.projectId, projects.id))
    .where(
      and(
        eq(conversations.id, conversationId),
        or(eq(conversations.participant1Id, userId), eq(conversations.participant2Id, userId)),
      ),
    )
    .limit(1);

  if (!row) return null;

  const otherId = row.participant1Id === userId ? row.participant2Id : row.participant1Id;
  const [other] = await db.select({ name: users.name, role: users.role }).from(users).where(eq(users.id, otherId)).limit(1);

  return {
    id: row.id,
    participant1Id: row.participant1Id,
    participant2Id: row.participant2Id,
    otherUserId: otherId,
    otherUserName: other?.name ?? 'مستخدم',
    otherUserRole: other?.role ?? 'client',
    projectId: row.projectId,
    projectTitle: row.projectTitle,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getMessages(conversationId: number, userId: number, limit = 100): Promise<MessageItem[]> {
  // verify access
  const [conv] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        or(eq(conversations.participant1Id, userId), eq(conversations.participant2Id, userId)),
      ),
    )
    .limit(1);

  if (!conv) return [];

  const rows = await db
    .select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      content: messages.content,
      isRead: messages.isRead,
      createdAt: messages.createdAt,
      senderName: users.name,
    })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt)
    .limit(limit);

  // mark others as read
  await db
    .update(messages)
    .set({ isRead: true })
    .where(and(eq(messages.conversationId, conversationId), sql`${messages.senderId} != ${userId}`, eq(messages.isRead, false)));

  return rows.map((r) => ({
    id: r.id,
    conversationId: r.conversationId,
    senderId: r.senderId,
    senderName: r.senderName,
    content: r.content,
    isRead: r.isRead,
    createdAt: r.createdAt,
  }));
}

export async function getOrCreateConversation(params: {
  currentUserId: number;
  otherUserId: number;
  projectId?: number | null;
}): Promise<number> {
  const { currentUserId, otherUserId, projectId } = params;

  if (currentUserId === otherUserId) throw new Error('لا يمكن إنشاء محادثة مع نفسك');

  const p1 = Math.min(currentUserId, otherUserId);
  const p2 = Math.max(currentUserId, otherUserId);

  // try find existing conversation between these two, optionally same project
  const existing = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.participant1Id, p1),
        eq(conversations.participant2Id, p2),
        projectId ? eq(conversations.projectId, projectId) : sql`TRUE`,
      ),
    )
    .orderBy(desc(conversations.updatedAt))
    .limit(1);

  if (existing.length > 0) return existing[0].id;

  const [created] = await db
    .insert(conversations)
    .values({
      participant1Id: p1,
      participant2Id: p2,
      projectId: projectId ?? null,
      lastMessageAt: null,
    })
    .returning({ id: conversations.id });

  return created.id;
}
