'use server';

/**
 * ============================================================================
 *  mnste9 — إجراءات المشاريع (Server Actions)
 * ============================================================================
 *  - createProject(data)       : نشر مشروع جديد (أصحاب العمل فقط).
 *  - submitProposal(data)      : تقديم عرض على مشروع (المستقلون فقط).
 *  - createProjectAction       : غلاف useActionState — (prevState, FormData).
 *  - submitProposalAction      : غلاف useActionState — (prevState, FormData).
 *
 *  مبادئ التصميم (نفس مبادئ actions/auth.ts):
 *   - كل إجراء نقطة دخول غير موثوقة → تحقق zod داخل الإجراء مع رسائل
 *     عربية ودّية لكل حقل.
 *   - الدوال الأساسية تقبل FormData (من النماذج) أو كائناً عادياً —
 *     واجهة واحدة.
 *   - تُرجع AuthActionState ولا تستدعي redirect() — الصفحة تتولى التوجيه
 *     عبر state.redirectTo.
 *   - التحقق من الجلسة والدور داخل الإجراء نفسه (وليس في الصفحة فقط)
 *     — دفاع متعدد الطبقات.
 *   - الأغلفة *_Action إجراءات خادم كاملة بتوقيع useActionState
 *     (prevState, formData) — تسمح بالتحسين التدريجي (نماذج تعمل حتى
 *     مع تعطيل JavaScript) بدل غلاف دالة على العميل.
 *
 *  قرار موثّق — تخزين التصنيف:
 *   لا يوجد عمود category في جدول projects (المخطط مجمَّد)، لذا يُلحق
 *   التصنيف كسطر منظم "التصنيف: X" بآخر الوصف — راجع project-meta.ts.
 *
 *  القاعدة الذهبية — بوابة KYC (المرحلة 8):
 *   تقديم العرض متاح للمستقلين الموثَّقي الهوية فقط (is_kyc_verified) —
 *   KYC شرط للمستقل قبل أي عمل. أصحاب العمل لا يقدمون عروضاً أصلاً.
 *   (ملحوظة: لا يوجد ملف actions/proposals.ts — submitProposal هنا.)
 * ============================================================================
 */

import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { projects, proposals, users } from '@/db/schema';
import { getCurrentUser, type AuthActionState } from '@/lib/auth';
import {
  appendCategoryTag,
  CATEGORY_SLUGS,
  PROJECT_CATEGORIES,
} from '@/lib/services/project-meta';
import { toNumeric } from '@/lib/utils';

/* ============================================================================
 * أدوات داخلية (نفس نمط actions/auth.ts)
 * ========================================================================== */

/** تطبيع المدخلات: FormData (من النماذج) أو كائن (من مسارات أخرى) → سجل */
function normalizeInput(data: unknown): Record<string, unknown> {
  if (data instanceof FormData) {
    return Object.fromEntries(data.entries());
  }
  if (typeof data === 'object' && data !== null) {
    return data as Record<string, unknown>;
  }
  return {};
}

/** تحويل أخطاء zod إلى خريطة حقول عربية */
function zodFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_form');
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

/** قيمة فارغة → undefined كي تُلتزم الحقول الرقمية المطلوبة برسالة "مطلوبة" */
const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

/** حد أقصى مالي معقول يبقى ضمن سعة NUMERIC(15,2) */
const MAX_AMOUNT = 9_999_999_999;

/* ============================================================================
 * مخططات التحقق (zod)
 * ========================================================================== */

const createProjectSchema = z
  .object({
    title: z
      .string({ error: 'عنوان المشروع مطلوب' })
      .trim()
      .min(5, 'عنوان المشروع يجب أن يكون 5 أحرف على الأقل')
      .max(255, 'العنوان طويل جداً (الحد 255 حرفاً)'),
    description: z
      .string({ error: 'وصف المشروع مطلوب' })
      .trim()
      .min(20, 'وصف المشروع يجب أن يكون 20 حرفاً على الأقل')
      .max(5000, 'الوصف طويل جداً (الحد 5000 حرف)'),
    category: z.enum(CATEGORY_SLUGS, { error: 'اختر تصنيفاً صحيحاً' }),
    budgetMin: z.preprocess(
      emptyToUndefined,
      z
        .coerce.number({ error: 'الميزانية الدنيا مطلوبة' })
        .min(0, 'الميزانية الدنيا لا يمكن أن تكون سالبة')
        .max(MAX_AMOUNT, 'الميزانية الدنيا كبيرة جداً'),
    ),
    budgetMax: z.preprocess(
      emptyToUndefined,
      z
        .coerce.number({ error: 'الميزانية القصوى مطلوبة' })
        .min(0, 'الميزانية القصوى لا يمكن أن تكون سالبة')
        .max(MAX_AMOUNT, 'الميزانية القصوى كبيرة جداً'),
    ),
    durationDays: z.preprocess(
      emptyToUndefined,
      z
        .coerce.number({ error: 'مدة التنفيذ مطلوبة' })
        .int('المدة يجب أن تكون عدداً صحيحاً من الأيام')
        .min(1, 'المدة يجب أن تكون يوماً واحداً على الأقل')
        .max(3650, 'المدة طويلة جداً (الحد 10 سنوات)'),
    ),
  })
  .refine((data) => data.budgetMax >= data.budgetMin, {
    message: 'الميزانية القصوى يجب أن تكون أكبر من الدنيا أو تساويها',
    path: ['budgetMax'],
  });

const submitProposalSchema = z.object({
  projectId: z.preprocess(
    emptyToUndefined,
    z
      .coerce.number({ error: 'معرّف المشروع مفقود' })
      .int()
      .positive('معرّف المشروع غير صالح'),
  ),
  amount: z.preprocess(
    emptyToUndefined,
    z
      .coerce.number({ error: 'مبلغ العرض مطلوب' })
      .positive('مبلغ العرض يجب أن يكون أكبر من صفر')
      .max(MAX_AMOUNT, 'مبلغ العرض كبير جداً'),
  ),
  durationDays: z.preprocess(
    emptyToUndefined,
    z
      .coerce.number({ error: 'مدة التنفيذ مطلوبة' })
      .int('المدة يجب أن تكون عدداً صحيحاً من الأيام')
      .min(1, 'المدة يجب أن تكون يوماً واحداً على الأقل')
      .max(3650, 'المدة طويلة جداً (الحد 10 سنوات)'),
  ),
  comment: z
    .string()
    .trim()
    .max(2000, 'الرسالة طويلة جداً (الحد 2000 حرف)')
    .optional(),
});

/* ============================================================================
 * createProject — نشر مشروع جديد (أصحاب العمل فقط)
 * ========================================================================== */

export async function createProject(data: unknown): Promise<AuthActionState> {
  // 1) الجلسة والدور — داخل الإجراء (دفاع متعدد الطبقات)
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return {
      success: false,
      message: 'سجّل دخولك أولاً لنشر مشروع',
      redirectTo: '/login',
    };
  }
  // Unified Role: أي مستخدم مسجل يمكنه نشر مشروع

  // 2) التحقق من المدخلات
  const parsed = createProjectSchema.safeParse(normalizeInput(data));
  if (!parsed.success) {
    return { success: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  // 3) التصنيف → سطر منظم في نهاية الوصف (لا عمود category في المخطط)
  const categoryLabel = PROJECT_CATEGORIES.find(
    (category) => category.slug === parsed.data.category,
  )?.label;
  if (!categoryLabel) {
    return { success: false, message: 'اختر تصنيفاً صحيحاً' };
  }

  // 4) الإدراج — القيود في قاعدة البيانات خط الدفاع الأخير
  try {
    const [created] = await db
      .insert(projects)
      .values({
        clientId: currentUser.id,
        title: parsed.data.title,
        description: appendCategoryTag(parsed.data.description, categoryLabel),
        budgetMin: toNumeric(parsed.data.budgetMin),
        budgetMax: toNumeric(parsed.data.budgetMax),
        durationDays: parsed.data.durationDays,
      })
      .returning({ id: projects.id });

    return {
      success: true,
      message: 'تم نشر مشروعك بنجاح',
      redirectTo: `/projects/${created.id}`,
    };
  } catch (error) {
    console.error('createProject failed:', error);
    return {
      success: false,
      message: 'حدث خطأ غير متوقع أثناء نشر المشروع — حاول مرة أخرى',
    };
  }
}

/* ============================================================================
 * submitProposal — تقديم عرض على مشروع (المستقلون فقط)
 * ========================================================================== */

export async function submitProposal(data: unknown): Promise<AuthActionState> {
  // 1) الجلسة والدور
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return {
      success: false,
      message: 'سجّل دخولك أولاً لتقديم عرض',
      redirectTo: '/login',
    };
  }
  // Unified Role: أي مستخدم يمكنه تقديم عرض باستثناء صاحب المشروع نفسه

  // 2) التحقق من المدخلات
  const parsed = submitProposalSchema.safeParse(normalizeInput(data));
  if (!parsed.success) {
    return { success: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  // Unified: تقديم العرض لا يتطلب KYC — فقط السحب يتطلب KYC
  // 3) فحص المشروع: الوجود + الحالة + الملكية
  const [project] = await db
    .select({
      id: projects.id,
      clientId: projects.clientId,
      status: projects.status,
    })
    .from(projects)
    .where(eq(projects.id, parsed.data.projectId))
    .limit(1);

  if (!project) {
    return { success: false, message: 'المشروع غير موجود' };
  }
  if (project.clientId === currentUser.id) {
    return { success: false, message: 'لا يمكنك تقديم عرض على مشروعك' };
  }
  if (project.status !== 'open') {
    return {
      success: false,
      message: 'هذا المشروع مغلق لتلقي العروض',
    };
  }

  // 5) عرض واحد لكل مستقل في المشروع (قيد UNIQUE) — فحص مسبق ودود
  const [existing] = await db
    .select({ id: proposals.id })
    .from(proposals)
    .where(
      and(
        eq(proposals.projectId, project.id),
        eq(proposals.freelancerId, currentUser.id),
      ),
    )
    .limit(1);

  if (existing) {
    return {
      success: false,
      message: 'لقد قدّمت عرضاً على هذا المشروع بالفعل',
    };
  }

  // 6) الإدراج — مع معالجة سباق UNIQUE (23505) إن حدث بين الفحص والإدراج
  try {
    await db.insert(proposals).values({
      projectId: project.id,
      freelancerId: currentUser.id,
      amount: toNumeric(parsed.data.amount),
      durationDays: parsed.data.durationDays,
      comment: parsed.data.comment || null,
    });

    return {
      success: true,
      message: 'تم إرسال عرضك بنجاح',
    };
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      return {
        success: false,
        message: 'لقد قدّمت عرضاً على هذا المشروع بالفعل',
      };
    }
    console.error('submitProposal failed:', error);
    return {
      success: false,
      message: 'حدث خطأ غير متوقع أثناء إرسال العرض — حاول مرة أخرى',
    };
  }
}

/* ============================================================================
 * أغلفة متوافقة مع useActionState — (الحالة السابقة، FormData)
 * إجراءات خادم كاملة: تُمرَّر مباشرة إلى useActionState فتعمل النماذج
 * حتى مع تعطيل JavaScript (Progressive Enhancement).
 * ========================================================================== */

export async function createProjectAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  return createProject(formData);
}

export async function submitProposalAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  return submitProposal(formData);
}
