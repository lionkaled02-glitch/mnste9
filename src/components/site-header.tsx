/**
 * ============================================================================
 *  خدمات — الشريط العلوي بأسلوب مستقل 100% — إصلاح التدويل
 * ============================================================================
 *  - يستخدم Link من @/i18n/navigation بدلاً من next/link
 *    ليضيف بادئة اللغة /ar تلقائياً ويحل مشكلة 404
 *  - المسارات: /projects -> /ar/projects, /projects/new, /login, /register
 *  - يحافظ على force-dynamic و unread counts
 * ============================================================================
 */

import { getLocale, getTranslations } from 'next-intl/server';
import { and, eq, ne, count } from 'drizzle-orm';

import { db } from '@/db';
import { messages, notifications } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { Link } from '@/i18n/navigation';

import { SiteHeaderDropdown } from './site-header-dropdown';
import { LanguageSwitcher } from './language-switcher';
import { MobileMenu } from './mobile-menu';

export const dynamic = 'force-dynamic';

async function getUnreadCounts(userId: number) {
  try {
    const [notifResult] = await db
      .select({ value: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    const [msgResult] = await db
      .select({ value: count() })
      .from(messages)
      .where(and(eq(messages.isRead, false), ne(messages.senderId, userId)));

    return {
      notifications: notifResult?.value ?? 0,
      messages: msgResult?.value ?? 0,
    };
  } catch {
    return { notifications: 0, messages: 0 };
  }
}

export async function SiteHeader() {
  const currentUser = await getCurrentUser();
  const locale = await getLocale();
  const initial = currentUser?.name?.trim().charAt(0) || 'خ';
  const t = await getTranslations('Header');

  // المسارات الصحيحة مع دعم التدويل التلقائي عبر Link من next-intl
  const navLinks = [
    { href: '/projects' as const, label: 'تصفح المشاريع' },
    { href: '/freelancers' as const, label: 'المستقلين' },
    { href: '/projects/new' as const, label: 'إضافة مشروع' },
  ];

  const mobileLinks = [
    { href: '/projects' as const, label: 'تصفح المشاريع' },
    { href: '/freelancers' as const, label: 'المستقلين' },
    { href: '/projects/new' as const, label: 'إضافة مشروع' },
    { href: '/help' as const, label: 'مركز المساعدة' },
    { href: '/about' as const, label: 'عن منصة خدمات' },
  ];

  let unreadNotifications = 0;
  let unreadMessages = 0;

  if (currentUser) {
    const counts = await getUnreadCounts(currentUser.id);
    unreadNotifications = counts.notifications;
    unreadMessages = counts.messages;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="relative mx-auto flex h-[60px] max-w-7xl items-center justify-between gap-4 px-4">
        {/* يمين — الشعار + روابط */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#2386c8] text-[16px] font-extrabold text-white shadow-sm">
              خ
            </span>
            <span className="text-[22px] font-extrabold tracking-tight text-[#222]">خدمات</span>
          </Link>

          <nav className="hidden items-center gap-5 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13.5px] font-medium text-[#444] transition hover:text-[#000]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* يسار — بحث + إشعارات + رسائل + مستخدم */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* بحث سريع - مع بادئة اللغة */}
          <form action={`/${locale}/projects`} method="get" className="hidden lg:block">
            <div className="relative">
              <input
                type="search"
                name="q"
                placeholder={t('searchPlaceholder') || 'ابحث عن مشروع...'}
                className="h-9 w-64 rounded-md border border-gray-200 bg-[#f4f5f7] px-3 py-2 pr-9 text-[13px] text-gray-800 placeholder-gray-400 outline-none transition focus:border-[#2386c8] focus:bg-white focus:ring-2 focus:ring-[#2386c8]/15"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </span>
            </div>
          </form>

          <div className="hidden sm:flex">
            <LanguageSwitcher />
          </div>

          {currentUser ? (
            <>
              {/* إشعارات */}
              <Link
                href="/dashboard"
                className="relative flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-[#666] transition hover:bg-[#f9f9f9] hover:text-[#222]"
                title="الإشعارات"
              >
                <svg className="h-[20px] w-[20px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                {unreadNotifications > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#e74c3c] px-1 text-[10px] font-bold leading-none text-white">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </Link>

              {/* رسائل */}
              <Link
                href="/dashboard/messages"
                className="relative flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-[#666] transition hover:bg-[#f9f9f9] hover:text-[#222]"
                title="الرسائل"
              >
                <svg className="h-[20px] w-[20px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                {unreadMessages > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#2386c8] px-1 text-[10px] font-bold leading-none text-white">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>

              {/* زر أضف مشروع بارز */}
              <Link
                href="/projects/new"
                className="hidden h-9 items-center justify-center gap-1 rounded-md bg-[#2386c8] px-4 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#1a6da8] sm:inline-flex"
              >
                <span className="text-[16px] leading-none">+</span>
                <span>أضف مشروع</span>
              </Link>

              <SiteHeaderDropdown name={currentUser.name} email={currentUser.email} initial={initial} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden h-9 items-center justify-center rounded-md px-3 text-[13px] font-medium text-[#444] transition hover:text-[#000] sm:inline-flex"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/register"
                className="flex h-9 items-center justify-center rounded-md bg-[#2386c8] px-4 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#1a6da8]"
              >
                حساب جديد
              </Link>
            </>
          )}

          <MobileMenu links={mobileLinks} isLoggedIn={Boolean(currentUser)} />
        </div>
      </div>
    </header>
  );
}
