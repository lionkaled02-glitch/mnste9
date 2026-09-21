/**
 * ============================================================================
 *  mnste9 — بيانات المستخدم للعرض (User Presentation Metadata)
 * ============================================================================
 *  وحدة نقية (PURE) بلا أي استيراد من قاعدة البيانات أو الخادم — آمنة
 *  للاستخدام في مكوّنات العميل والسيرفر على حد سواء (نفس فلسفة
 *  project-meta.ts للمشاريع).
 *
 *  المحتوى:
 *   - ROLE_LABELS / getRoleLabel : تسميات الأدوار بالعربية.
 *   - KYC_LABELS                 : نصوص حالة توثيق الهوية.
 *   - PREFERRED_CURRENCY_OPTIONS : خيارات العملة المفضلة — USD وSAR حصراً.
 *
 *  قرار موثّق — لا ريال يمني (YER):
 *   بنك الكريمي (بوابة الحوالات المحلية الوحيدة في المنصة) يدعم الدولار
 *   الأمريكي والريال السعودي فقط، لذا تُقيد العملة المفضلة بهما على مستوى
 *   النوع currency_enum في قاعدة البيانات وعلى مستوى الخيارات هنا.
 * ============================================================================
 */

/** أدوار المستخدمين في المنصة (مطابقة لقيد ck_users_role في المخطط) */
export type UserRole = 'client' | 'freelancer' | 'admin';

/** تسميات الأدوار بالعربية */
export const ROLE_LABELS: Record<UserRole, string> = {
  client: 'صاحب عمل',
  freelancer: 'مستقل',
  admin: 'مشرف',
};

/** تسمية الدور بالعربية — بصيغة احتياطية للأدوار غير المعروفة */
export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role as UserRole] ?? 'مستخدم';
}

/** نصوص حالة توثيق الهوية (KYC) — نفس صياغة صفحة المستقلين */
export const KYC_LABELS = {
  verified: 'هوية موثّقة (KYC) ✓',
  unverified: 'الهوية غير موثّقة بعد',
} as const;

/**
 * خيارات العملة المفضلة في الملف الشخصي.
 * القيم مطابقة حرفياً لنوع currency_enum في قاعدة البيانات (USD | SAR).
 */
export const PREFERRED_CURRENCY_OPTIONS = [
  { value: 'USD', label: 'دولار أمريكي (USD)' },
  { value: 'SAR', label: 'ريال سعودي (SAR)' },
] as const;

/** قيم العملات المفضلة المقبولة — مشتقة من الخيارات أعلاه */
export type PreferredCurrency = (typeof PREFERRED_CURRENCY_OPTIONS)[number]['value'];
