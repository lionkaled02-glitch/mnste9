/**
 * ============================================================================
 *  mnste9 — ثوابت وأدوات عرض المشاريع (طبقة نقية بلا قاعدة بيانات)
 * ============================================================================
 *  هذا الملف آمن للاستيراد من مكوّنات العميل (Client Components) — لا يستورد
 *  drizzle أو pg إطلاقاً. استعلامات قاعدة البيانات في src/lib/services/projects.ts.
 *
 *  قرار معماري موثّق — التصنيف بلا عمود في قاعدة البيانات:
 *   جدول projects (المخطط المجمَّد بموجب قواعد المرحلة) لا يوجد فيه عمود
 *   category. الحل المعتمد:
 *    1) عند نشر مشروع، يُلحق سطر منظم بآخر الوصف:  "التصنيف: برمجة".
 *    2) فلترة التصنيف تعمل بمطابقة جذوع كلمات عربية (ILIKE) على العنوان
 *       والوصف — فتشمل المشاريع المنشورة عبر النموذج (سطر التصنيف) وأي
 *       مشاريع تذكر التصنيف صراحةً في نصها.
 *    3) عند العرض يُخفى سطر التصنيف من الوصف ويُعرض مكانه شارة تصنيف.
 *   التخزين قابل للترحيل لاحقاً إلى عمود حقيقي بمجرد السماح بتعديل المخطط.
 *
 *  ملاحظة التقييم في بطاقة العميل:
 *   لا يوجد جدول تقييمات في المخطط الحالي، لذا يُعرض "لا تقييمات بعد"
 *   حتى تُبنى منظومة التقييمات في مرحلة قادمة.
 * ============================================================================
 */

/* ============================================================================
 * التصنيفات — الترتيب مطابق لمواصفة المرحلة
 * stems: جذوع كلمات عربية للمطابقة (برمج تطابق: برمجة، مبرمج، برمجيات…)
 * ========================================================================== */

export interface ProjectCategory {
  slug: string;
  label: string;
  stems: readonly string[];
}

export const PROJECT_CATEGORIES: readonly ProjectCategory[] = [
  {
    slug: 'programming',
    label: 'برمجة',
    stems: ['برمج', 'تطوير', 'موقع', 'ويب', 'تطبيق'],
  },
  {
    slug: 'design',
    label: 'تصميم',
    stems: ['تصميم', 'مصمم', 'جرافيك', 'هوية'],
  },
  {
    slug: 'writing',
    label: 'كتابة',
    stems: ['كتابة', 'كاتب', 'مقال', 'محتوى'],
  },
  {
    slug: 'marketing',
    label: 'تسويق',
    stems: ['تسويق', 'إعلان', 'حملة'],
  },
  {
    slug: 'translation',
    label: 'ترجمة',
    stems: ['ترجم'],
  },
  {
    slug: 'accounting',
    label: 'محاسبة',
    stems: ['محاسب', 'مالي', 'فاتور'],
  },
];

/** قيم slugs كـ tuple — للاستخدام مع z.enum في طبقة الإجراءات */
export const CATEGORY_SLUGS = [
  'programming',
  'design',
  'writing',
  'marketing',
  'translation',
  'accounting',
] as const;

export type ProjectCategorySlug = (typeof CATEGORY_SLUGS)[number];

/* ============================================================================
 * فلاتر الميزانية — الدلالة: تقاطع نطاق ميزانية المشروع [min, max]
 * مع النطاق المختار (أي مشروع يمكن أن يقع ضمن النطاق يظهر)
 * ========================================================================== */

export interface BudgetFilterOption {
  value: string;
  label: string;
}

export const BUDGET_FILTERS: readonly BudgetFilterOption[] = [
  { value: 'under100', label: 'أقل من 100$' },
  { value: '100to500', label: '100 - 500$' },
  { value: '500to1000', label: '500 - 1000$' },
  { value: 'over1000', label: 'أكثر من 1000$' },
];

export const BUDGET_FILTER_VALUES = [
  'under100',
  '100to500',
  '500to1000',
  'over1000',
] as const;

export type BudgetFilterValue = (typeof BUDGET_FILTER_VALUES)[number];

/* ============================================================================
 * خيارات الترتيب
 * ========================================================================== */

export const SORT_OPTIONS = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'budget', label: 'الأعلى ميزانية' },
] as const;

export type ProjectSortValue = (typeof SORT_OPTIONS)[number]['value'];

/* ============================================================================
 * حالات المشروع — متزامنة مع project_status_enum في المخطط
 * (لا يمكن استيراد المخطط هنا لأن هذا الملف يُستورد من العميل)
 * ========================================================================== */

export type ProjectStatusKey = 'open' | 'in_progress' | 'completed' | 'cancelled';

export const PROJECT_STATUS_LABELS: Record<ProjectStatusKey, string> = {
  open: 'مفتوح',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

/** ألوان شارات الحالة — هادئة ومتمايزة */
export const PROJECT_STATUS_BADGE_CLASSES: Record<ProjectStatusKey, string> = {
  open: 'bg-emerald-100 text-emerald-800',
  in_progress: 'bg-amber-100 text-amber-800',
  completed: 'bg-sky-100 text-sky-800',
  cancelled: 'bg-slate-100 text-slate-600',
};

/* ============================================================================
 * تحليل معاملات URL (searchParams) — قيم غير صالحة تُهمل بصمت
 * ========================================================================== */

export function parseCategoryParam(raw: unknown): ProjectCategorySlug | undefined {
  return typeof raw === 'string' &&
    CATEGORY_SLUGS.includes(raw as ProjectCategorySlug)
    ? (raw as ProjectCategorySlug)
    : undefined;
}

export function parseBudgetParam(raw: unknown): BudgetFilterValue | undefined {
  return typeof raw === 'string' &&
    BUDGET_FILTER_VALUES.includes(raw as BudgetFilterValue)
    ? (raw as BudgetFilterValue)
    : undefined;
}

export function parseSortParam(raw: unknown): ProjectSortValue {
  return raw === 'budget' ? 'budget' : 'newest';
}

/* ============================================================================
 * سطر التصنيف داخل الوصف (تخزين منظم — راجع الترويسة)
 * ========================================================================== */

export const CATEGORY_TAG_PREFIX = 'التصنيف:';

/** إلحاق سطر التصنيف بآخر الوصف عند الإنشاء */
export function appendCategoryTag(description: string, label: string): string {
  return `${description}\n\n${CATEGORY_TAG_PREFIX} ${label}`;
}

const CATEGORY_TAG_REGEX = new RegExp(
  `\\s*\\n\\s*\\n\\s*${CATEGORY_TAG_PREFIX}\\s*(?:${PROJECT_CATEGORIES.map(
    (category) => category.label,
  ).join('|')})\\s*$`,
  'u',
);

/** إزالة سطر التصنيف عند العرض (يُعرض مكانه شارة تصنيف) */
export function stripCategoryTag(description: string): string {
  return description.replace(CATEGORY_TAG_REGEX, '');
}

/** استنتاج التصنيف من نص المشروع (أول تطابق بترتيب التصنيفات) */
export function deriveCategoryLabel(text: string): string | undefined {
  for (const category of PROJECT_CATEGORIES) {
    if (category.stems.some((stem) => text.includes(stem))) {
      return category.label;
    }
  }
  return undefined;
}

/* ============================================================================
 * تنسيقات عرض — أرقام غربية للمبالغ والمدد (المتعارف عليه مع $)،
 * والتواريخ عبر formatDate (ar-YE) في طبقة العرض
 * ========================================================================== */

/** "150.00" → "150" | "99.50" → "99.50" */
function formatAmount(value: string): string {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(2);
}

/** نطاق الميزانية: "150$ – 300$" أو قيمة واحدة "150$" */
export function formatBudgetRange(min: string, max: string): string {
  const formattedMin = formatAmount(min);
  const formattedMax = formatAmount(max);
  return formattedMin === formattedMax
    ? `${formattedMin}$`
    : `${formattedMin}$ – ${formattedMax}$`;
}

/** المدة بالأيام بصيغة عربية سليمة */
export function formatDurationDays(days: number): string {
  if (days === 1) return 'يوم واحد';
  if (days === 2) return 'يومان';
  if (days >= 3 && days <= 10) return `${days} أيام`;
  return `${days} يوماً`;
}

/** عدد المشاريع بصيغة عربية سليمة */
export function formatProjectCount(count: number): string {
  if (count === 0) return 'لا مشاريع';
  if (count === 1) return 'مشروع واحد';
  if (count === 2) return 'مشروعان';
  if (count >= 3 && count <= 10) return `${count} مشاريع`;
  return `${count} مشروعاً`;
}

/** عدد العروض بصيغة عربية سليمة */
export function formatProposalCount(count: number): string {
  if (count === 0) return 'لا عروض بعد';
  if (count === 1) return 'عرض واحد';
  if (count === 2) return 'عرضان';
  if (count >= 3 && count <= 10) return `${count} عروض`;
  return `${count} عرضاً`;
}
