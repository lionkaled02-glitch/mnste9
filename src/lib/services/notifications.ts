import { and, count, desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { notifications } from '@/db/schema';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface CreateNotificationInput {
  userId: number;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string | null;
}

export async function createNotification(input: CreateNotificationInput) {
  const [notification] = await db
    .insert(notifications)
    .values({
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type ?? 'info',
      link: input.link ?? null,
    })
    .returning();
  return notification;
}

export async function getUnreadCount(userId: number): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return Number(row?.value ?? 0);
}

export async function getNotifications(userId: number, limit = 20) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markAsRead(notificationId: number, userId: number) {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

export async function markAllAsRead(userId: number) {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

export type NotificationDTO = Awaited<ReturnType<typeof getNotifications>>[number];
