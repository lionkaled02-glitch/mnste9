/**
 * ============================================================================
 * خدمات — Middleware (i18n + حماية المسارات)
 * ============================================================================
 */

import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';

import { SESSION_COOKIE_NAME, verifySession } from '@/lib/session';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

const PROTECTED_PREFIXES = ['/dashboard', '/wallet', '/contracts', '/admin'];
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

  // تجاهل api و _next والملفات الثابتة
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_vercel') ||
    pathname.includes('.')
  ) {
    return intlMiddleware(request);
  }

  // Auto-Redirect للغة
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

  // حماية المسارات
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

  // توجيه اللغة
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
