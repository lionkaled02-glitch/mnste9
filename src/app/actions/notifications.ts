'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/auth';
import { markAllAsRead, markAsRead } from '@/lib/services/notifications';

export async function markNotificationAsReadAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const id = Number(formData.get('id'));
  if (!Number.isSafeInteger(id) || id <= 0) return;
  await markAsRead(id, user.id);
  revalidatePath('/dashboard/notifications');
}

export async function markAllNotificationsAsReadAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await markAllAsRead(user.id);
  revalidatePath('/dashboard/notifications');
}
