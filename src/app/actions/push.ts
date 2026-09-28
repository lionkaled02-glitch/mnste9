'use server';

import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { pushSubscriptions } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';

interface PushSubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
}

export async function subscribeToPushAction(subscription: PushSubscriptionInput) {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: 'غير مصرح' };

  try {
    if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return { success: false, message: 'بيانات غير صالحة' };
    }

    await db
      .insert(pushSubscriptions)
      .values({
        userId: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: subscription.userAgent ?? null,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          userId: user.id,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent: subscription.userAgent ?? null,
        },
      });

    return { success: true };
  } catch (error) {
    console.error('subscribeToPushAction failed', error);
    return { success: false, message: 'فشل الحفظ' };
  }
}

export async function unsubscribeFromPushAction(endpoint: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: 'غير مصرح' };

  try {
    if (!endpoint) return { success: false, message: 'بيانات غير صالحة' };

    await db
      .delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, user.id), eq(pushSubscriptions.endpoint, endpoint)));

    return { success: true };
  } catch (error) {
    console.error('unsubscribeFromPushAction failed', error);
    return { success: false, message: 'فشل الحذف' };
  }
}
