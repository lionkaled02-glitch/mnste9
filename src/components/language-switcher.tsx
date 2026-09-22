'use client';

/**
 * خدمات — زر تبديل اللغة (عربي | English) — إصلاح التدويل
 * - يستخدم navigation من next-intl لتبديل المسار مع بادئة اللغة
 * - /ar/projects <-> /en/projects
 */

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useTransition } from 'react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const toggleLocale = () => {
    const nextLocale = locale === 'ar' ? 'en' : 'ar';
    startTransition(() => {
      // استخدام router.replace مع locale الجديد — يضيف البادئة تلقائياً
      router.replace(pathname, { locale: nextLocale as 'ar' | 'en' });
    });
  };

  return (
    <button
      type="button"
      onClick={toggleLocale}
      disabled={isPending}
      aria-label={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#555] transition hover:bg-[#f4f5f7] hover:text-[#222] disabled:opacity-60"
    >
      <span className="text-[11px]">🌐</span>
      {locale === 'ar' ? 'English' : 'عربي'}
    </button>
  );
}
