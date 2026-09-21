/**
 * ============================================================================
 *  mnste9 — بيانات المحفظة للعرض (Wallet Presentation Metadata)
 * ============================================================================
 *  وحدة نقية (PURE) بلا أي استيراد من قاعدة البيانات — آمنة لمكوّنات
 *  العميل والسيرفر (نفس فلسفة project-meta.ts وuser-meta.ts).
 *
 *  المحتوى:
 *   - WALLET_TABS            : تبويبات صفحة المحفظة الأربعة (?tab=).
 *   - TRANSACTION_TYPE_LABELS / TRANSACTION_STATUS_LABELS /
 *     PAYMENT_METHOD_LABELS  : تسميات عربية للحقول المرجعية (enum).
 *   - USD_TO_SAR_RATE        : سعر تحويل العرض من الدولار للريال السعودي.
 *
 *  قرار موثّق — المحفظة مقوَّمة بالدولار (USD):
 *   أرصدة wallets/hard currency في المخطط NUMERIC بلا عمود عملة، والمنصة
 *   تعرضها بالدولار اتساقاً مع المراحل السابقة. بطاقة الرصيد تعرض
 *   المكافئ بالريال السعودي (SAR) بسعر تحويل ثابت للعرض فقط — التحويل
 *   الفعلي يجري في بنك الكريمي عند الاعتماد (الريال السعودي مربوط
 *   بالدولار American بسعر ثابت 3.75).
 * ============================================================================
 */

/** تبويبات صفحة المحفظة — القيم في معامل URL ?tab= */
export const WALLET_TABS = [
  { key: 'balance', label: 'الرصيد' },
  { key: 'transactions', label: 'المعاملات' },
  { key: 'methods', label: 'طرق الدفع' },
  { key: 'settings', label: 'الإعدادات المالية' },
] as const;

export type WalletTab = (typeof WALLET_TABS)[number]['key'];

/** تحويل قيمة ?tab= إلى تبويب صالح (الافتراضي: الرصيد) */
export function parseWalletTab(value: string | undefined): WalletTab {
  return value === 'transactions' || value === 'methods' || value === 'settings'
    ? value
    : 'balance';
}

/** أنواع الحركات المالية (transaction_type_enum) */
export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  deposit: 'إيداع',
  withdrawal: 'سحب',
  escrow_lock: 'حجز ضمان',
  escrow_release: 'تحرير ضمان',
  commission: 'عمولة المنصة',
};

/** حالات الحركات (transaction_status_enum) */
export const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  completed: 'مكتملة',
  failed: 'فاشلة',
  refunded: 'مُستردة',
};

/** ألوان شارات حالة الحركة */
export const TRANSACTION_STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-slate-100 text-slate-600',
};

/** طرق الدفع (payment_method_enum) — NULL للحركات الداخلية */
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  kuraimi: 'بنك الكريمي',
  paypal: 'PayPal',
};

/**
 * سعر تحويل العرض: 1 USD = 3.75 SAR (ربط ثابت).
 * للعرض فقط — لا يُستخدم في أي حساب مالي خلفي.
 */
export const USD_TO_SAR_RATE = 3.75;

/** العملات المقبولة في حقول المبالغ بالدولار */
export const MIN_TRANSACTION_AMOUNT = 1;
