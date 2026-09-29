import { and, eq, gt, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { conversations, messages } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const url = new URL(request.url);
  const conversationId = Number(url.searchParams.get('conversationId'));
  const since = Number(url.searchParams.get('since') ?? 0);

  if (!Number.isSafeInteger(conversationId) || conversationId <= 0) {
    return NextResponse.json({ error: 'معرّف غير صالح' }, { status: 400 });
  }

  const [conversation] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        or(
          eq(conversations.participant1Id, user.id),
          eq(conversations.participant2Id, user.id),
        ),
      ),
    )
    .limit(1);

  if (!conversation) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  }

  const rows = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        gt(messages.id, Number.isSafeInteger(since) && since > 0 ? since : 0),
      ),
    )
    .orderBy(messages.createdAt);

  return NextResponse.json({ messages: rows });
}
