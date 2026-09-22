/**
 * ============================================================================
 *  mnste9 — الشريط العلوي (Site Header) — المرحلة 10 نهائي
 * ============================================================================
 *  - بعد تسجيل الدخول: يخفي login/register ويعرض Avatar + dropdown
 *  - Dropdown: الملف الشخصي، أعمالي، الإعدادات، تسجيل الخروج
 *  - نشر مشروع يظهر في القائمة العلوية بعد تسجيل الدخول — معيار نجاح
 *  - force-dynamic لمنع cache
 * ============================================================================
 */

import Link from 'next/link';

import { getCurrentUser } from '@/lib/auth';

import { SiteHeaderDropdown } from './site-header-dropdown';

export const dynamic = 'force-dynamic';

const PUBLIC_LINKS = [
  { href: '/projects', label: 'المشاريع' },
  { href: '/freelancers', label: 'المستقلون' },
  { href: '/help', label: 'مركز المساعدة' },
  { href: '/about', label: 'من نحن' },
];

export async function SiteHeader() {
  const currentUser = await getCurrentUser();
  const initial = currentUser?.name?.trim().charAt(0) || 'م';

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
                نشر مشروع
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {currentUser ? (
            <>
              <Link
                href="/dashboard"
                className="hidden rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 sm:inline-flex"
              >
                لوحة التحكم
              </Link>
              <SiteHeaderDropdown name={currentUser.name} email={currentUser.email} initial={initial} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:text-emerald-700"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                إنشاء حساب
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
              نشر مشروع
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
