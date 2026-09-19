/**
 * ============================================================================
 *  mnste9 — POST /api/auth/register
 * ============================================================================
 *  استقبال بيانات التسجيل (JSON)، التحقق عبر zod (داخل registerUser)،
 *  إنشاء الحساب مع محفظته، وإصدار كوكي جلسة فوري.
 *
 *  الطلب:  { "name": "...", "email": "...", "password": "..." }
 *  النجاح: 201 + { success: true, message, redirectTo } + Set-Cookie
 *  الفشل:  400 (أخطاء تحقق/بريد مكرر) أو 500 (خطأ غير متوقع)
 * ============================================================================
 */

import { NextResponse } from 'next/server';

import { registerUser } from '@/app/actions/auth';

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'جسم الطلب يجب أن يكون JSON صالحاً' },
      { status: 400 },
    );
  }

  const state = await registerUser(body);

  if (!state.success) {
    return NextResponse.json(state, { status: 400 });
  }

  return NextResponse.json(state, { status: 201 });
}
