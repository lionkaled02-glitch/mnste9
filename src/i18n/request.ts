/**
 * ============================================================================
 *  mnste9 — إعدادات طلب next-intl
 * ============================================================================
 *  - يحدد اللغة الحالية من كوكي NEXT_LOCALE أو Accept-Language
 *  - يحمل ملفات الترجمة من src/messages/{locale}.json
 *  - العربية افتراضية
 * ============================================================================
 */

import { getRequestConfig } from 'next-intl/server';

import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // requestLocale يأتي من middleware (كوكي NEXT_LOCALE)
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
