/**
 * ============================================================================
 *  mnste9 — حماية المسارات (Route Protection)
 * ============================================================================
 *  يحمي صفحات المنصة الخاصة:
 *    /dashboard/*  و  /wallet/*  و  /contracts/*
 *  بإعادة توجيه غير المسجلين إلى /login مع الاحتفاظ بالمسار الأصلي في
 *  معامل ?from= للعودة إليه بعد الدخول.
 *
 *  ملاحظات معمارية:
 *   - التحقق هنا بالتوقيع فقط (JWT عبر jose — وحدة session.ts الخفيفة)
 *     بلا وصول لقاعدة البيانات: الـ middleware يجب أن يبقى سريعاً وخفيف
 *     الاعتماديات، والتحقق الكامل من المستخدم يحدث في الطبقات الداخلية
 *     (getCurrentUser) — الطبقات الدفاعية المتعددة.
 *   - سياسة fail-closed: أي رمز مفقود/غير صالح/منتهي = غير موثّق → إعادة
 *     توجيه فورية.
 *   - في Next.js 16 أُعيدت تسمية هذا الملف تقليدياً إلى proxy.ts —
 *     الاسم الحالي (middleware.ts) مدعوم للتوافق الخلفي.
 * ============================================================================
 */

import { NextResponse, type NextRequest } from 'next/server';

import { SESSION_COOKIE_NAME, verifySession } from '@/lib/session';

/** المسارات المحمية — تطابق matcher أدناه (دفاع مزدوج) */
const PROTECTED_PREFIXES = ['/dashboard', '/wallet', '/contracts'];

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(token);

  if (session) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/dashboard/:path*', '/wallet/:path*', '/contracts/:path*'],
};
