'use client';

/**
 * ============================================================================
 *  mnste9 — زر تبديل اللغة (عربي | English) — المرحلة 1 i18n
 * ============================================================================
 *  - يقرأ اللغة الحالية من next-intl
 *  - عند الضغط يبدل الكوكي NEXT_LOCALE ويعيد تحميل الصفحة
 *  - تصميم Tailwind بسيط
 * ============================================================================
 */

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const toggleLocale = () => {
    const nextLocale = locale === 'ar' ? 'en' : 'ar';

    // حفظ اللغة في كوكي NEXT_LOCALE لمدة سنة
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;

    startTransition(() => {
      router.refresh();
      // إعادة تحميل كاملة لضمان تغيير dir و lang في <html>
      window.location.reload();
    });
  };

  return (
    <button
      type="button"
      onClick={toggleLocale}
      disabled={isPending}
      aria-label={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60"
    >
      <span className="text-[11px]">🌐</span>
      {locale === 'ar' ? 'English' : 'عربي'}
    </button>
  );
}
