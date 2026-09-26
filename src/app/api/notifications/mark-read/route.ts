import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { markAllAsRead, markAsRead } from '@/lib/services/notifications';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { id?: number; all?: boolean };
  if (body.all) {
    await markAllAsRead(user.id);
    return NextResponse.json({ success: true });
  }
  if (Number.isSafeInteger(body.id) && Number(body.id) > 0) {
    await markAsRead(Number(body.id), user.id);
  }
  return NextResponse.json({ success: true });
}
