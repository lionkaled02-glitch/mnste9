import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { getUnreadCount } from '@/lib/services/notifications';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ count: 0 });
  const count = await getUnreadCount(user.id);
  return NextResponse.json({ count });
}
