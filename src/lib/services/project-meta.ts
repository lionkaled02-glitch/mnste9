/**
 * ============================================================================
 *  خدمات — ثوابت وأدوات عرض المشاريع (طبقة نقية بلا قاعدة بيانات)
 * ============================================================================
 *  طبقة آمنة للعميل — لا تستورد drizzle أو pg
 *  استعلامات قاعدة البيانات في src/lib/services/projects.ts
 *
 *  التصنيف بلا عمود في قاعدة البيانات — يُخزن كسطر "التصنيف: X"
 *  في آخر الوصف، والفلترة بمطابقة جذوع كلمات (ILIKE)
 * ============================================================================
 */

/* ============================================================================
 * التصنيفات — موسعة لأسلوب مستقل / Upwork (8 أقسام رئيسية)
 * ========================================================================== */

export interface ProjectCategory {
  slug: string;
  label: string;
  stems: readonly string[];
  icon?: string;
}

export const PROJECT_CATEGORIES: readonly ProjectCategory[] = [
  {
    slug: 'programming',
    label: 'برمجة وتطوير',
    stems: ['برمج', 'تطوير', 'موقع', 'ويب', 'تطبيق', 'برمجة', 'كود', 'API', 'React', 'Node'],
  },
  {
    slug: 'design',
    label: 'تصميم وإبداع',
    stems: ['تصميم', 'مصمم', 'جرافيك', 'هوية', 'UI', 'UX', 'فوتوشوب', 'إبداع'],
  },
  {
    slug: 'marketing',
    label: 'تسويق رقمي',
    stems: ['تسويق', 'إعلان', 'حملة', 'SEO', 'سوشيال', 'تسويق رقمي'],
  },
  {
    slug: 'writing',
    label: 'كتابة وترجمة',
    stems: ['كتابة', 'كاتب', 'مقال', 'محتوى', 'ترجم', 'كتابة'],
  },
  {
    slug: 'admin',
    label: 'دعم إداري',
    stems: ['إداري', 'إدخال', 'بيانات', 'سكرتارية', 'دعم إداري', 'مساعد'],
  },
  {
    slug: 'video',
    label: 'فيديو وأنيميشن',
    stems: ['فيديو', 'مونتاج', 'أنيميشن', 'موشن', 'تعليق صوتي', 'تصوير'],
  },
  {
    slug: 'business',
    label: 'أعمال واستشارات',
    stems: ['أعمال', 'استشارة', 'دراسة جدوى', 'خطة عمل', 'استشارات'],
  },
  {
    slug: 'engineering',
    label: 'هندسة وعمارة',
    stems: ['هندسة', 'معماري', 'خرائط', 'أوتوكاد', 'عمارة'],
  },
  // توافق قديم
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

export const CATEGORY_SLUGS = [
  'programming',
  'design',
  'writing',
  'marketing',
  'translation',
  'accounting',
  'admin',
  'video',
  'business',
  'engineering',
] as const;

export type ProjectCategorySlug = (typeof CATEGORY_SLUGS)[number];

/* ============================================================================
 * فلاتر الميزانية — قديم (للتوافق) + جديد min/max
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
 * خيارات الترتيب — موسعة حسب المواصفات
 * ========================================================================== */

export const SORT_OPTIONS = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'oldest', label: 'الأقدم' },
  { value: 'budget_high', label: 'الأعلى ميزانية' },
  { value: 'budget_low', label: 'الأقل ميزانية' },
  { value: 'proposals_least', label: 'الأقل عروضاً' },
  { value: 'proposals_most', label: 'الأكثر عروضاً' },
  // توافق قديم
  { value: 'budget', label: 'الأعلى ميزانية' },
] as const;

export type ProjectSortValue = (typeof SORT_OPTIONS)[number]['value'];

/* ============================================================================
 * حالات المشروع
 * ========================================================================== */

export type ProjectStatusKey = 'open' | 'in_progress' | 'completed' | 'cancelled';

export const PROJECT_STATUS_LABELS: Record<ProjectStatusKey, string> = {
  open: 'مفتوح',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

export const PROJECT_STATUS_BADGE_CLASSES: Record<ProjectStatusKey, string> = {
  open: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  in_progress: 'bg-amber-50 text-amber-700 border border-amber-200',
  completed: 'bg-[#2386c8]/10 text-[#2386c8] border border-[#2386c8]/20',
  cancelled: 'bg-gray-100 text-gray-600 border border-gray-200',
};

export const STATUS_FILTERS: readonly { value: ProjectStatusKey; label: string }[] = [
  { value: 'open', label: 'مفتوح' },
  { value: 'in_progress', label: 'قيد التنفيذ' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغي' },
];

/* ============================================================================
 * تحليل معاملات URL
 * ========================================================================== */

export function parseCategoryParam(raw: unknown): ProjectCategorySlug | undefined {
  return typeof raw === 'string' && CATEGORY_SLUGS.includes(raw as ProjectCategorySlug)
    ? (raw as ProjectCategorySlug)
    : undefined;
}

export function parseBudgetParam(raw: unknown): BudgetFilterValue | undefined {
  return typeof raw === 'string' && BUDGET_FILTER_VALUES.includes(raw as BudgetFilterValue)
    ? (raw as BudgetFilterValue)
    : undefined;
}

export function parseSortParam(raw: unknown): ProjectSortValue {
  const valid = SORT_OPTIONS.map((o) => o.value);
  if (typeof raw === 'string' && valid.includes(raw as ProjectSortValue)) {
    return raw as ProjectSortValue;
  }
  return 'newest';
}

export function parseStatusParam(raw: unknown): ProjectStatusKey | undefined {
  const valid: ProjectStatusKey[] = ['open', 'in_progress', 'completed', 'cancelled'];
  return typeof raw === 'string' && valid.includes(raw as ProjectStatusKey)
    ? (raw as ProjectStatusKey)
    : undefined;
}

export function parseQParam(raw: unknown): string | undefined {
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim().slice(0, 100);
  }
  return undefined;
}

export function parseNumberParam(raw: unknown): number | undefined {
  if (typeof raw === 'string') {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return undefined;
}

export function parsePageParam(raw: unknown): number {
  const n = parseNumberParam(raw);
  if (n && Number.isInteger(n) && n >= 1 && n <= 1000) return n;
  return 1;
}

/* ============================================================================
 * سطر التصنيف داخل الوصف
 * ========================================================================== */

export const CATEGORY_TAG_PREFIX = 'التصنيف:';

export function appendCategoryTag(description: string, label: string): string {
  return `${description}\n\n${CATEGORY_TAG_PREFIX} ${label}`;
}

const CATEGORY_TAG_REGEX = new RegExp(
  `\\s*\\n\\s*\\n\\s*${CATEGORY_TAG_PREFIX}\\s*(?:${PROJECT_CATEGORIES.map(
    (category) => category.label,
  ).join('|')})\\s*$`,
  'u',
);

export function stripCategoryTag(description: string): string {
  return description.replace(CATEGORY_TAG_REGEX, '');
}

export function deriveCategoryLabel(text: string): string | undefined {
  for (const category of PROJECT_CATEGORIES) {
    if (category.stems.some((stem) => text.includes(stem))) {
      return category.label;
    }
  }
  return undefined;
}

export function deriveCategorySlug(text: string): ProjectCategorySlug | undefined {
  for (const category of PROJECT_CATEGORIES) {
    if (category.stems.some((stem) => text.includes(stem))) {
      return category.slug as ProjectCategorySlug;
    }
  }
  return undefined;
}

/* ============================================================================
 * المهارات — استخراج badges من النص (تقريب بسيط)
 * ========================================================================== */

const COMMON_SKILLS = [
  'React',
  'Next.js',
  'Vue',
  'Angular',
  'Node.js',
  'PHP',
  'Laravel',
  'WordPress',
  'Flutter',
  'تصميم',
  'UI/UX',
  'فوتوشوب',
  'SEO',
  'تسويق',
  'كتابة',
  'ترجمة',
  'مونتاج',
  'موشن',
  'هوية بصرية',
  'تطبيق جوال',
  'موقع إلكتروني',
  'API',
  'قاعدة بيانات',
  'إدخال بيانات',
];

export function extractSkills(text: string, limit = 4): string[] {
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const skill of COMMON_SKILLS) {
    if (lower.includes(skill.toLowerCase()) || text.includes(skill)) {
      found.push(skill);
      if (found.length >= limit) break;
    }
  }
  // إذا لم نجد مهارات، استخدم التصنيف كمهارة
  if (found.length === 0) {
    const cat = deriveCategoryLabel(text);
    if (cat) found.push(cat);
  }
  return found;
}

/* ============================================================================
 * تنسيقات عرض
 * ========================================================================== */

function formatAmount(value: string): string {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return value;
  return Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(2);
}

export function formatBudgetRange(min: string, max: string): string {
  const formattedMin = formatAmount(min);
  const formattedMax = formatAmount(max);
  return formattedMin === formattedMax ? `${formattedMin}$` : `${formattedMin}$ – ${formattedMax}$`;
}

export function formatBudgetShort(min: string, max: string): string {
  return formatBudgetRange(min, max);
}

export function formatDurationDays(days: number): string {
  if (days === 1) return 'يوم واحد';
  if (days === 2) return 'يومان';
  if (days >= 3 && days <= 10) return `${days} أيام`;
  return `${days} يوماً`;
}

export function formatProjectCount(count: number): string {
  if (count === 0) return 'لا مشاريع';
  if (count === 1) return 'مشروع واحد';
  if (count === 2) return 'مشروعان';
  if (count >= 3 && count <= 10) return `${count} مشاريع`;
  return `${count} مشروعاً`;
}

export function formatProposalCount(count: number): string {
  if (count === 0) return 'لا عروض بعد';
  if (count === 1) return 'عرض واحد';
  if (count === 2) return 'عرضان';
  if (count >= 3 && count <= 10) return `${count} عروض`;
  return `${count} عرضاً`;
}

export function timeAgo(date: Date): string {
  try {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'منذ يوم';
    if (days < 7) return `منذ ${days} أيام`;
    if (days < 30) return `منذ ${Math.floor(days / 7)} أسابيع`;
    return new Date(date).toLocaleDateString('ar-YE');
  } catch {
    return '';
  }
}
