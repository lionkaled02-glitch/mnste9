/**
 * ============================================================================
 *  mnste9 — أدوات مساعدة عامة (Utilities)
 * ============================================================================
 *  - cn():             دمج أصناف Tailwind مع حل التعارضات.
 *  - formatCurrency(): تنسيق المبالغ بعملات المنصة (ريال يمني/سعودي/دولار).
 *  - formatDate():     تنسيق التواريخ للواجهة العربية.
 *  - toNumeric():      تحويل آمن إلى نص NUMERIC(15,2) للاستخدام مع Drizzle.
 *
 *  ملاحظة مالية مهمة:
 *   الأعمدة المالية في المخطط من نوع NUMERIC(15,2) ويعيدها Drizzle كنص (string)
 *   عمداً لتجنب أخطاء الفاصلة العائمة. عند الحاجة لحسابات مالية دقيقة استخدم
 *   الحساب على المنازل الصغرى (integer cents) ثم حوّل النتيجة بـ toNumeric().
 * ============================================================================
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/* ============================================================================
 * cn — دمج أصناف CSS مع أولوية Tailwind
 * ========================================================================== */

/** دمج أصناف شرطية وحل تعارضات Tailwind (الأخير يفوز) */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/* ============================================================================
 * formatCurrency — تنسيق المبالغ المالية
 * ========================================================================== */

/** العملات المدعومة في المنصة */
export type SupportedCurrency = 'YER' | 'SAR' | 'USD';

/** اللغة الافتراضية لكل عملة */
const CURRENCY_DEFAULT_LOCALE: Record<SupportedCurrency, string> = {
  YER: 'ar-YE',
  SAR: 'ar-SA',
  USD: 'en-US',
};

/**
 * تنسيق مبلغ مالي بعملة المنصة.
 *
 * @param amount    المبلغ (رقم أو نص NUMERIC كما يعيده Drizzle — مثل "1250.50")
 * @param currency  العملة: YER (افتراضي) | SAR | USD
 * @param locale    إعدادات لغوية اختيارية (الافتراضي حسب العملة)
 *
 * @example
 *   formatCurrency(1250.5)                    // "١٬٢٥٠٫٥٠ ر.ي."
 *   formatCurrency('99.99', 'USD')            // "$99.99"
 *   formatCurrency(150, 'SAR')                // "١٥٠٫٠٠ ر.س."
 */
export function formatCurrency(
  amount: string | number,
  currency: SupportedCurrency = 'YER',
  locale: string = CURRENCY_DEFAULT_LOCALE[currency],
): string {
  const value =
    typeof amount === 'number' ? amount : Number.parseFloat(amount);

  if (!Number.isFinite(value)) {
    throw new Error(`قيمة مالية غير صالحة للتنسيق: ${String(amount)}`);
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/* ============================================================================
 * formatDate — تنسيق التواريخ
 * ========================================================================== */

/**
 * تنسيق تاريخ للعرض في الواجهة العربية.
 *
 * @param date     التاريخ (Date أو ISO string أو Unix timestamp بالمللي ثانية)
 * @param locale   إعدادات لغوية (الافتراضي ar-YE)
 * @param options  خيارات Intl.DateTimeFormat إضافية تكتب فوق الافتراضيات
 *
 * @example
 *   formatDate(new Date())                                   // "١٩ سبتمبر ٢٠٢٦"
 *   formatDate('2026-09-19T12:00:00Z', 'ar-YE', { dateStyle: 'full' })
 */
export function formatDate(
  date: Date | string | number,
  locale: string = 'ar-YE',
  options: Intl.DateTimeFormatOptions = {},
): string {
  const parsed = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`تاريخ غير صالح للتنسيق: ${String(date)}`);
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    ...options,
  }).format(parsed);
}

/* ============================================================================
 * toNumeric — تحويل آمن إلى صيغة NUMERIC(15,2)
 * ========================================================================== */

/** الحد الأقصى للجزء الصحيح في NUMERIC(15,2) هو 13 خانة */
const NUMERIC_MAX_ABS = 1e13;

/**
 * تحويل قيمة مالية إلى نص بخانتين عشريتين — الصيغة التي يتوقعها Drizzle
 * للأعمدة من نوع numeric({ precision: 15, scale: 2 }).
 *
 * يرفض القيم غير الرقمية (NaN/Infinity/نصوص غير رقمية) والقيم التي تتجاوز
 * سعة العمود، كي لا نصل أبداً إلى خطأ قاعدة بيانات بصمت.
 *
 * لا يفرض قواعد عمل (مثل الموجبية) — تلك مسؤولية طبقة الخدمات والتحقق.
 *
 * @example
 *   toNumeric(1250.5)      // "1250.50"
 *   toNumeric('99')        // "99.00"
 *   toNumeric('abc')       // يرمي خطأ
 */
export function toNumeric(value: string | number): string {
  const parsed =
    typeof value === 'number' ? value : Number.parseFloat(value.trim());

  if (!Number.isFinite(parsed)) {
    throw new Error(`قيمة مالية غير صالحة: ${String(value)}`);
  }

  if (Math.abs(parsed) >= NUMERIC_MAX_ABS) {
    throw new Error(
      `القيمة ${String(value)} تتجاوز الحد الأقصى لعمود NUMERIC(15,2)`,
    );
  }

  return parsed.toFixed(2);
}
