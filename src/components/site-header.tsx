/**
 * ============================================================================
 *  mnste9 — الشريط العلوي (Site Header) — المرحلة 1 i18n + المرحلة 10
 * ============================================================================
 *  - بعد تسجيل الدخول: يخفي login/register ويعرض Avatar + dropdown
 *  - نشر مشروع يظهر في القائمة العلوية بعد تسجيل الدخول
 *  - زر تبديل اللغة (عربي | English) — يبدل كوكي NEXT_LOCALE ويعيد التحميل
 *  - يدعم next-intl مع ترجمات Header
 *  - force-dynamic لمنع cache
 * ============================================================================
 */

import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { getCurrentUser } from '@/lib/auth';

import { SiteHeaderDropdown } from './site-header-dropdown';
import { LanguageSwitcher } from './language-switcher';

export const dynamic = 'force-dynamic';

export async function SiteHeader() {
  const currentUser = await getCurrentUser();
  const initial = currentUser?.name?.trim().charAt(0) || 'م';
  const t = await getTranslations('Header');

  const PUBLIC_LINKS = [
    { href: '/', label: t('home') },
    { href: '/projects', label: t('projects') },
    { href: '/freelancers', label: t('freelancers') },
    { href: '/help', label: t('help') },
    { href: '/about', label: t('about') },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7 12 3 4 7v10l8 4 8-4V7Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 4 8-4M12 21V11" />
              </svg>
            </span>
            <span className="text-lg font-bold text-gray-900">mnste9</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {PUBLIC_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
            {currentUser && (
              <Link
                href="/projects/new"
                className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                {t('postProject')}
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {currentUser ? (
            <>
              <Link
                href="/dashboard"
                className="hidden rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 sm:inline-flex"
              >
                {t('dashboard')}
              </Link>
              <SiteHeaderDropdown name={currentUser.name} email={currentUser.email} initial={initial} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:text-emerald-700"
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                {t('register')}
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 bg-white md:hidden">
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 py-1.5">
          {PUBLIC_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              {link.label}
            </Link>
          ))}
          {currentUser && (
            <Link
              href="/projects/new"
              className="whitespace-nowrap rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
            >
              {t('postProject')}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
