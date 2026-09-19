/**
 * ============================================================================
 *  mnste9 — GET /api/auth/session
 * ============================================================================
 *  استرجاع المستخدم الحالي من كوكي الجلسة (للتحقق من حالة المصادقة).
 *
 *  النجاح: 200 + { success: true, user: SafeUser }
 *  بدون جلسة صالحة: 401 + { success: false, user: null }
 * ============================================================================
 */

import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';

export async function GET(): Promise<NextResponse> {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, user: null },
      { status: 401 },
    );
  }

  return NextResponse.json({ success: true, user }, { status: 200 });
}
