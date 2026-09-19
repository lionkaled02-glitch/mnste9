/**
 * ============================================================================
 *  mnste9 — POST /api/auth/login
 * ============================================================================
 *  تسجيل الدخول بالبريد وكلمة المرور وإصدار كوكي جلسة (HttpOnly).
 *
 *  الطلب:  { "email": "...", "password": "..." }
 *  النجاح: 200 + { success: true, message, redirectTo } + Set-Cookie
 *  الفشل:  400 (أخطاء تحقق) أو 401 (بيانات دخول غير صحيحة)
 * ============================================================================
 */

import { NextResponse } from 'next/server';

import { loginUser } from '@/app/actions/auth';

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

  const state = await loginUser(body);

  if (!state.success) {
    /* 401 لبيانات الدخول غير الصحيحة، 400 لأخطاء التحقق البنيوية */
    const isCredentialsError = Boolean(state.message) && !state.fieldErrors;
    return NextResponse.json(
      state,
      { status: isCredentialsError ? 401 : 400 },
    );
  }

  return NextResponse.json(state, { status: 200 });
}
