/**
 * ============================================================================
 *  خدمات — Middleware موحد (i18n + حماية المسارات) — إصلاح التدويل
 * ============================================================================
 *  - i18n: localePrefix: always — كل المسارات تحمل /ar أو /en
 *    - إذا كان المسار بدون بادئة لغة، يتم Auto-Redirect إلى /ar/{path}
 *    - مثال: /projects -> /ar/projects, /login -> /ar/login
 *  - حماية: يحمي /dashboard/* و /wallet/* و /contracts/*
 *    مع دعم البادئة اللغوية (/ar/dashboard, /en/dashboard)
 *  - next-intl middleware يتولى ضبط اللغة والكوكي
 * ============================================================================
 */

import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';

import { SESSION_COOKIE_NAME, verifySession } from '@/lib/session';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

const PROTECTED_PREFIXES = ['/dashboard', '/wallet', '/contracts'];
const LOCALES = routing.locales as unknown as string[];
const DEFAULT_LOCALE = routing.defaultLocale;

function getPathWithoutLocale(pathname: string): string {
  for (const locale of LOCALES) {
    if (pathname === `/${locale}`) return '/';
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(`/${locale}`.length) || '/';
    }
  }
  return pathname;
}

function hasLocalePrefix(pathname: string): boolean {
  return LOCALES.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
}

export default async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // تجاهل api و _next والملفات الثابتة (يتم عبر matcher لكن احتياط)
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_vercel') ||
    pathname.includes('.')
  ) {
    return intlMiddleware(request);
  }

  // 1) Auto-Redirect: إذا كان المسار بدون بادئة لغة، أضف /ar تلقائياً
  if (!hasLocalePrefix(pathname)) {
    const newUrl = new URL(`/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`, request.url);
    newUrl.search = request.nextUrl.search;
    const isProtectedOriginal = PROTECTED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
    if (isProtectedOriginal) {
      const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
      const session = await verifySession(token);
      if (!session) {
        const loginUrl = new URL(`/${DEFAULT_LOCALE}/login`, request.url);
        loginUrl.searchParams.set('from', `/${DEFAULT_LOCALE}${pathname}`);
        return NextResponse.redirect(loginUrl);
      }
    }
    return NextResponse.redirect(newUrl);
  }

  // 2) حماية المسارات مع بادئة اللغة — /register و /login و /select-account-type عامة
  const pathWithoutLocale = getPathWithoutLocale(pathname);
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathWithoutLocale === prefix || pathWithoutLocale.startsWith(`${prefix}/`),
  );

  if (isProtected) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySession(token);

    if (!session) {
      const locale = pathname.split('/')[1] || DEFAULT_LOCALE;
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3) توجيه اللغة (next-intl)
  return intlMiddleware(request);
}

export const config = {
  // يطابق جميع المسارات عدا api و _next و الملفات الثابتة
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};