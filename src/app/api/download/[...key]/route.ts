import { and, eq, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { contracts } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { getPresignedUrl } from '@/lib/services/b2-storage';

interface RouteContext {
  params: Promise<{ key: string[] }>;
}

function extractContractId(key: string): number | null {
  const match = key.match(/^contracts\/(\d+)\/deliveries\//);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { key: keyParts } = await context.params;
  const key = keyParts.map((part) => decodeURIComponent(part)).join('/');
  const contractId = extractContractId(key);

  if (!contractId) {
    return NextResponse.json({ error: 'Invalid file key' }, { status: 400 });
  }

  const [contract] = await db
    .select({ id: contracts.id })
    .from(contracts)
    .where(
      and(
        eq(contracts.id, contractId),
        or(
          eq(contracts.clientId, currentUser.id),
          eq(contracts.freelancerId, currentUser.id),
        ),
      ),
    )
    .limit(1);

  if (!contract) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const downloadName = request.nextUrl.searchParams.get('name') ?? undefined;
  const url = await getPresignedUrl(key, 3600, downloadName);

  return NextResponse.json({ url });
}
