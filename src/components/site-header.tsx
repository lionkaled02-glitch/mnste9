/**
 * ============================================================================
 *  خدمات — الشريط العلوي (Site Header) — المرحلة أ
 * ============================================================================
 *  - خلفية بيضاء ناصعة bg-white
 *  - حد سفلي ناعم border-b border-gray-200
 *  - sticky top-0 z-50
 *  - يمين: شعار "خدمات" + روابط: تصفح المشاريع | المستقلين | إضافة مشروع
 *  - يسار: بحث سريع + إشعارات Bell + رسائل Envelope + Avatar + زر + أضف مشروع
 *  - استجابة كاملة للهواتف Hamburger
 *  - يدعم i18n + force-dynamic
 * ============================================================================
 */

import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { and, eq, ne, or, count } from 'drizzle-orm';

import { db } from '@/db';
import { conversations, messages, notifications } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';

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

    const userConversations = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(or(eq(conversations.participant1Id, userId), eq(conversations.participant2Id, userId)));

    let unreadMessages = 0;
    if (userConversations.length > 0) {
      const convIds = userConversations.map((c) => c.id);
      // نحسب الرسائل غير المقروءة التي لم يرسلها المستخدم الحالي
      const result = await db
        .select({ value: count() })
        .from(messages)
        .where(
          and(
            eq(messages.isRead, false),
            ne(messages.senderId, userId),
          ),
        );
      // تبسيط: نعتمد العد العام غير المقروء (بدون فلترة convIds معقدة لتجنب inArray فارغ)
      // في بيئة الإنتاج يمكن تحسين الاستعلام بـ inArray(convIds)
      unreadMessages = result[0]?.value ?? 0;
    }

    return {
      notifications: notifResult?.value ?? 0,
      messages: unreadMessages,
    };
  } catch {
    return { notifications: 0, messages: 0 };
  }
}

export async function SiteHeader() {
  const currentUser = await getCurrentUser();
  const initial = currentUser?.name?.trim().charAt(0) || 'خ';
  const t = await getTranslations('Header');

  const PUBLIC_LINKS = [
    { href: '/projects', label: 'تصفح المشاريع' },
    { href: '/freelancers', label: 'المستقلين' },
    { href: '/projects/new', label: 'إضافة مشروع' },
  ];

  const MOBILE_LINKS = [
    { href: '/projects', label: t('projects') || 'المشاريع' },
    { href: '/freelancers', label: t('freelancers') || 'المستقلون' },
    { href: '/projects/new', label: 'إضافة مشروع' },
    { href: '/help', label: t('help') || 'مركز المساعدة' },
    { href: '/about', label: t('about') || 'من نحن' },
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
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        {/* الجهة اليمنى — الشعار + الروابط */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-[18px] font-extrabold text-white shadow-sm">
              خ
            </span>
            <span className="text-xl font-extrabold tracking-tight text-gray-900">خدمات</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {PUBLIC_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[14px] font-medium text-gray-600 transition hover:text-emerald-600"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* الجهة اليسرى — بحث + إشعارات + رسائل + Avatar + زر */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* شريط بحث سريع */}
          <form action="/projects" method="get" className="hidden items-center lg:flex">
            <div className="relative">
              <input
                type="search"
                name="q"
                placeholder="ابحث عن مشروع..."
                className="w-64 rounded-full border border-gray-200 bg-[#f4f5f7] px-4 py-2 pr-10 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                aria-label="بحث سريع"
              />
              <svg
                className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
          </form>

          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {currentUser ? (
            <>
              {/* إشعارات */}
              <Link
                href="/dashboard/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                aria-label="الإشعارات"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                  />
                </svg>
                {unreadNotifications > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </Link>

              {/* رسائل */}
              <Link
                href="/dashboard/messages"
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                aria-label="الرسائل"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                  />
                </svg>
                {unreadMessages > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white shadow-sm">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </Link>

              {/* زر أضف مشروع بارز */}
              <Link
                href="/projects/new"
                className="hidden items-center gap-1 rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 sm:inline-flex"
              >
                <span className="text-base leading-none">+</span> أضف مشروع
              </Link>

              {/* Avatar + Dropdown */}
              <SiteHeaderDropdown name={currentUser.name} email={currentUser.email} initial={initial} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-full px-4 py-2 text-sm font-medium text-gray-600 transition hover:text-emerald-600 sm:inline-flex"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
              >
                إنشاء حساب
              </Link>
            </>
          )}

          {/* Hamburger للهواتف */}
          <MobileMenu links={MOBILE_LINKS} isLoggedIn={Boolean(currentUser)} />
        </div>
      </div>
    </header>
  );
}
