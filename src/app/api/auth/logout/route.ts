/**
 * ============================================================================
 *  mnste9 — POST /api/auth/logout
 * ============================================================================
 *  تسجيل الخروج: حذف كوكي الجلسة.
 *
 *  النجاح دائماً 200 (حتى بدون جلسة أصلاً — الخروج idempotent).
 * ============================================================================
 */

import { NextResponse } from 'next/server';

import { logoutUser } from '@/app/actions/auth';

export async function POST(): Promise<NextResponse> {
  const state = await logoutUser();
  return NextResponse.json(state, { status: 200 });
}
