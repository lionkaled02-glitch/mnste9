/**
 * ============================================================================
 *  mnste9 — Middleware موحد (i18n + حماية المسارات) — المرحلة 1
 * ============================================================================
 *  - i18n: يستخدم next-intl لتحديد اللغة من كوكي NEXT_LOCALE أو Accept-Language
 *    العربية افتراضية (ar)، الإنجليزية خيار ثانٍ (en)، بدون prefix في URL
 *  - حماية: يحمي /dashboard/* و /wallet/* و /contracts/* بإعادة توجيه
 *    غير المسجلين إلى /login مع ?from=
 *  - سياسة fail-closed: أي رمز مفقود/غير صالح = غير موثّق → redirect
 * ============================================================================
 */

import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';

import { SESSION_COOKIE_NAME, verifySession } from '@/lib/session';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

const PROTECTED_PREFIXES = ['/dashboard', '/wallet', '/contracts'];

export default async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // حماية المسارات الخاصة
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySession(token);

    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // توجيه اللغة (next-intl)
  return intlMiddleware(request);
}

export const config = {
  // يطابق جميع المسارات عدا api و _next و الملفات الثابتة
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
