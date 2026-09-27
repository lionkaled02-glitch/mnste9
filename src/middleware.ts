/**
 * ============================================================================
 *  خدمات — Middleware موحد (i18n + حماية المسارات + Rate Limiting)
 * ============================================================================
 */

import { eq } from 'drizzle-orm';
import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';

import { db } from '@/db';
import { sessions } from '@/db/schema';
import { routing } from '@/i18n/routing';
import { checkRateLimit } from '@/lib/services/rate-limit';
import { SESSION_COOKIE_NAME, verifySession } from '@/lib/session';

const intlMiddleware = createMiddleware(routing);

const PROTECTED_PREFIXES = ['/dashboard', '/wallet', '/contracts', '/admin'];
const LOCALES = routing.locales as unknown as string[];
const DEFAULT_LOCALE = routing.defaultLocale;

function getPathWithoutLocale(pathname: string): string {
  for (const locale of LOCALES) {
    if (pathname === `/${locale}`) return '/';
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(`/${locale}`.length) || '/';
  }
  return pathname;
}

function hasLocalePrefix(pathname: string): boolean {
  return LOCALES.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
}

function requestIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'unknown';
}

async function rateLimitAuthRequest(request: NextRequest, pathname: string) {
  const pathWithoutLocale = getPathWithoutLocale(pathname);
  const ip = requestIp(request);
  const isLogin = pathname === '/api/auth/login' || pathWithoutLocale === '/login';
  const isRegister = pathname === '/api/auth/register' || pathWithoutLocale === '/register';

  if (isLogin) {
    const result = await checkRateLimit(`login:${ip}`, 5, 60, 15);
    if (!result.allowed) return NextResponse.json({ error: `تم تجاوز الحد. حاول بعد ${result.retryAfter} ثانية.` }, { status: 429 });
  }

  if (isRegister) {
    const result = await checkRateLimit(`register:${ip}`, 3, 3600, 60);
    if (!result.allowed) return NextResponse.json({ error: `تم تجاوز الحد. حاول بعد ${result.retryAfter} ثانية.` }, { status: 429 });
  }

  return null;
}

async function touchSession(token: string | undefined) {
  if (!token) return;
  try {
    await db.update(sessions).set({ lastActiveAt: new Date() }).where(eq(sessions.token, token));
  } catch (error) {
    console.error('touchSession failed:', error);
  }
}

export default async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const rateLimitResponse = await rateLimitAuthRequest(request, pathname);
  if (rateLimitResponse) return rateLimitResponse;

  if (pathname.startsWith('/api')) return NextResponse.next();

  if (pathname.startsWith('/_next') || pathname.startsWith('/_vercel') || pathname.includes('.')) {
    return intlMiddleware(request);
  }

  if (!hasLocalePrefix(pathname)) {
    const newUrl = new URL(`/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`, request.url);
    newUrl.search = request.nextUrl.search;
    const isProtectedOriginal = PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
    if (isProtectedOriginal) {
      const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
      const session = await verifySession(token);
      if (!session) {
        const loginUrl = new URL(`/${DEFAULT_LOCALE}/login`, request.url);
        loginUrl.searchParams.set('from', `/${DEFAULT_LOCALE}${pathname}`);
        return NextResponse.redirect(loginUrl);
      }
      await touchSession(token);
    }
    return NextResponse.redirect(newUrl);
  }

  const pathWithoutLocale = getPathWithoutLocale(pathname);
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathWithoutLocale === prefix || pathWithoutLocale.startsWith(`${prefix}/`));

  if (isProtected) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySession(token);
    if (!session) {
      const locale = pathname.split('/')[1] || DEFAULT_LOCALE;
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    await touchSession(token);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};
