/**
 * ============================================================================
 *  mnste9 — إعدادات توجيه اللغات (next-intl)
 * ============================================================================
 *  - العربية افتراضية (ar)
 *  - الإنجليزية خيار ثانٍ (en)
 *  - بدون prefix في الـ URL (localePrefix: never) — يحافظ على المسارات الحالية
 *    مثل /projects و /dashboard بدون تغيير
 *  - اللغة تُحفظ في كوكي NEXT_LOCALE
 * ============================================================================
 */

import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
  localePrefix: 'never',
});
