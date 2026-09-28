import webpush from 'web-push';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { pushSubscriptions } from '@/db/schema';

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:support@khadamat.com';

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
}

function isWebPushError(error: unknown): error is { statusCode?: number; message?: string } {
  return typeof error === 'object' && error !== null;
}

export async function sendPushToUser(userId: number, payload: PushPayload) {
  if (!publicKey || !privateKey) {
    console.warn('VAPID keys not configured — push skipped');
    return [];
  }

  const subscriptions = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  if (subscriptions.length === 0) return [];

  return Promise.allSettled(
    subscriptions.map(async (sub) => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSub, JSON.stringify(payload));
        return { success: true, endpoint: sub.endpoint };
      } catch (error) {
        const statusCode = isWebPushError(error) ? error.statusCode : undefined;
        const message = isWebPushError(error) ? (error.message ?? 'Unknown push error') : 'Unknown push error';

        if (statusCode === 410 || statusCode === 404) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
        }

        console.error('sendPush failed', sub.endpoint, message);
        return { success: false, endpoint: sub.endpoint, error: message };
      }
    }),
  );
}

export async function sendPushToUsers(userIds: number[], payload: PushPayload) {
  return Promise.all(userIds.map((id) => sendPushToUser(id, payload)));
}
