/**
 * ============================================================================
 *  mnste9 — بيانات توثيق الهوية للعرض (KYC Presentation Metadata)
 * ============================================================================
 *  وحدة نقية (PURE) — تسميات أنواع الوثائق وحالاتها وخيارات نموذج الرفع.
 *  القيم مطابقة لقيود CHECK في جدول kyc_documents (documentType IN
 *  national_id | passport | driver_license | other، status IN pending |
 *  approved | rejected).
 * ============================================================================
 */

/** خيارات نوع الوثيقة في نموذج الرفع (القيم حرفياً كما في قيد القاعدة) */
export const KYC_DOCUMENT_TYPE_OPTIONS = [
  { value: 'national_id', label: 'بطاقة الهوية الوطنية' },
  { value: 'passport', label: 'جواز السفر' },
  { value: 'driver_license', label: 'رخصة القيادة' },
  { value: 'other', label: 'وثيقة أخرى' },
] as const;

export type KycDocumentType = (typeof KYC_DOCUMENT_TYPE_OPTIONS)[number]['value'];

/** تسميات أنواع الوثائق للعرض */
export const KYC_DOCUMENT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  KYC_DOCUMENT_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);

/** تسميات حالة طلب التوثيق */
export const KYC_STATUS_LABELS: Record<string, string> = {
  pending: 'قيد المراجعة',
  approved: 'معتمدة',
  rejected: 'مرفوضة',
};

/** ألوان شارات حالة التوثيق */
export const KYC_STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-700',
};

/** أنواع الملفات المقبولة للوثائق (صور + PDF) */
export const KYC_ALLOWED_MIME_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

/** الحد الأقصى لحجم الوثيقة (5 ميغابايت) */
export const KYC_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
