import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { getNotifications } from '@/lib/services/notifications';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ items: [] });
  const items = await getNotifications(user.id, 10);
  return NextResponse.json({ items });
}
