'use server';

/**
 * ============================================================================
 *  mnste9 — إجراءات الملف الشخصي والإعدادات (Server Actions)
 * ============================================================================
 *  - updateProfile(data)   : تحديث بيانات الملف الشخصي (تحديث جزئي).
 *  - updatePassword(data)  : تغيير كلمة المرور مع التحقق من الحالية.
 *  - updateProfileAction   : غلاف useActionState — (prevState, FormData).
 *  - updatePasswordAction  : غلاف useActionState — (prevState, FormData).
 *  - notificationPreferenceAction : إجراء نموذج مباشر لمفاتيح تفضيلات
 *    الإشعارات في صفحة الإعدادات (بلا useActionState — يعيد التوجيه إلى
 *    تسجيل الدخول إن انتهت الجلسة).
 *
 *  مبادئ التصميم (نفس مبادئ actions/auth.ts وactions/projects.ts):
 *   - كل إجراء نقطة دخول غير موثوقة → تحقق zod داخل الإجراء مع رسائل
 *     عربية ودّية لكل حقل.
 *   - الدوال الأساسية تقبل FormData (من النماذج) أو كائناً عادياً —
 *     واجهة واحدة تخدم مسارَي النماذج و API.
 *   - تُرجع AuthActionState ولا تستدعي redirect() — الصفحة تتولى التوجيه
 *     عبر state.redirectTo (ما عدا غلاف مفاتيح الإشعارات أدناه).
 *   - التحقق من الجلسة داخل الإجراء نفسه — دفاع متعدد الطبقات.
 *
 *  قرار موثّق — دلالات التحديث الجزئي (Partial Update):
 *   الحقل الغائب عن الطلب (غير المرسَل أصلاً) يبقى على قيمته الحالية،
 *   بينما الحقل المرسَل فارغاً يُمسَح (NULL). هذا يسمح لنماذج مستقلة —
 *   مثل مفاتيح تبويب الإشعارات — بتحديث حقولها فقط دون إرسال البقية،
 *   ويُبقي نموذج الملف الشخصي كاملاً يعمل كالمعتاد.
 *
 *  قرار موثّق — العملة المفضلة:
 *   USD أو SAR حصراً (قيد currency_enum في القاعدة) — بنك الكريمي لا
 *   يدعم الريال اليمني.
 *
 *  قرار موثّق — المعلومات المهنية:
 *   حقول المهارات/النبذة/السعر بالساعة تُحفَظ للمستقلين فقط، حتى لو
 *   أرسلها دور آخر (بوابة الدور داخل الإجراء — دفاع متعدد الطبقات).
 * ============================================================================
 */

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { db } from '@/db';
import { users } from '@/db/schema';
import {
  getCurrentUser,
  hashPassword,
  verifyPassword,
  type AuthActionState,
} from '@/lib/auth';
import { toNumeric } from '@/lib/utils';

/* ============================================================================
 * أدوات داخلية (نفس نمط actions/auth.ts وactions/projects.ts)
 * ========================================================================== */

/** تحويل أخطاء zod إلى خريطة حقول عربية */
function zodFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_form');
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

/**
 * تطبيع مدخلات الملف الشخصي: FormData (من النماذج) أو كائن (من API).
 *
 * فارق جوهري عن normalizeInput العام: من FormData تُستخرج الحقول الحاضرة
 * فقط — الحقل غير المرسَل يبقى غائباً كي تتحقق دلالات التحديث الجزئي
 * (الغائب = بلا تغيير)، بينما المرسَل فارغاً يصل كما هو ويُمسَح لاحقاً.
 */
const PROFILE_FIELD_NAMES = [
  'name',
  'phone',
  'city',
  'preferredCurrency',
  'skills',
  'bio',
  'hourlyRate',
  'avatarUrl',
  'notifyEmail',
  'notifySms',
] as const;

function normalizeProfileInput(data: unknown): Record<string, unknown> {
  if (data instanceof FormData) {
    const input: Record<string, unknown> = {};
    for (const key of PROFILE_FIELD_NAMES) {
      if (data.has(key)) {
        const value = data.get(key);
        input[key] = typeof value === 'string' ? value : String(value);
      }
    }
    return input;
  }
  if (typeof data === 'object' && data !== null) {
    return { ...(data as Record<string, unknown>) };
  }
  return {};
}

/** تطبيع عام لكلمات المرور: FormData أو كائن → سجل بسيط */
function normalizeInput(data: unknown): Record<string, unknown> {
  if (data instanceof FormData) {
    return Object.fromEntries(data.entries());
  }
  if (typeof data === 'object' && data !== null) {
    return data as Record<string, unknown>;
  }
  return {};
}

/**
 * قيمة نصية اختيارية قابلة للمسح:
 *   غائب (undefined) → يبقى بلا تغيير | فارغ ("") → يُمسَح (null)
 *   | قيمة → تُقلَّم وتُتحقَّق ثم تُحفَظ.
 */
const clearableText = (schema: z.ZodType<string>) =>
  z.preprocess(
    (value) => {
      if (value === undefined || value === null) return value;
      if (typeof value !== 'string') return value;
      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    },
    schema.nullable(),
  );

/** قيمة منطقية من نموذج (المدخلات الخفية "true"/"false") أو من كائن API */
const booleanField = z
  .preprocess(
    (value) =>
      value === 'true' ? true : value === 'false' ? false : value,
    z.boolean({ error: 'قيمة التفضيل غير صالحة' }),
  )
  .optional();

/** صيغة رقم الهاتف: أرقام ورمز + وفواصل فقط (6-30 حرفاً) */
const PHONE_PATTERN = /^[+\d][\d\s\-()]{5,29}$/;

/** حد أقصى مالي معقول يبقى ضمن سعة NUMERIC(15,2) — نفس حد المشاريع */
const MAX_AMOUNT = 9_999_999_999;

/* ============================================================================
 * مخططات التحقق (zod)
 * ========================================================================== */

const updateProfileSchema = z.object({
  name: z
    .string({ error: 'الاسم مطلوب' })
    .trim()
    .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
    .max(100, 'الاسم طويل جداً (الحد 100 حرف)')
    .optional(),
  phone: clearableText(
    z
      .string({ error: 'رقم الهاتف غير صالح' })
      .max(30, 'رقم الهاتف طويل جداً (الحد 30 حرفاً)')
      .regex(
        PHONE_PATTERN,
        'صيغة رقم الهاتف غير صحيحة — استخدم الأرقام مع رمز الدولة مثل +967771234567',
      ),
  ).optional(),
  city: clearableText(
    z.string({ error: 'اسم المدينة غير صالح' }).max(
      100,
      'اسم المدينة طويل جداً (الحد 100 حرف)',
    ),
  ).optional(),
  preferredCurrency: z
    .preprocess(
      (value) => (value === '' ? null : value),
      z
        .enum(['USD', 'SAR'], {
          error:
            'العملة المفضلة يجب أن تكون دولاراً أمريكياً (USD) أو ريالاً سعودياً (SAR) — الريال اليمني غير مدعوم',
        })
        .nullable(),
    )
    .optional(),
  skills: clearableText(
    z
      .string({ error: 'المهارات غير صالحة' })
      .max(500, 'المهارات طويلة جداً (الحد 500 حرف)'),
  ).optional(),
  bio: clearableText(
    z
      .string({ error: 'النبذة غير صالحة' })
      .max(1000, 'النبذة طويلة جداً (الحد 1000 حرف)'),
  ).optional(),
  hourlyRate: z
    .preprocess(
      (value) => {
        if (value === undefined || value === null) return value;
        if (typeof value !== 'string') return value;
        const trimmed = value.trim();
        return trimmed === '' ? null : trimmed;
      },
      z
        .coerce.number({ error: 'السعر بالساعة يجب أن يكون رقماً' })
        .positive('السعر بالساعة يجب أن يكون أكبر من صفر')
        .max(MAX_AMOUNT, 'السعر بالساعة كبير جداً')
        .nullable(),
    )
    .optional(),
  avatarUrl: clearableText(
    z
      .string({ error: 'رابط الصورة غير صالح' })
      .url('رابط الصورة يجب أن يكون رابطاً صحيحاً')
      .max(500, 'رابط الصورة طويل جداً (الحد 500 حرف)'),
  ).optional(),
  notifyEmail: booleanField,
  notifySms: booleanField,
});

const updatePasswordSchema = z
  .object({
    currentPassword: z
      .string({ error: 'كلمة المرور الحالية مطلوبة' })
      .min(1, 'كلمة المرور الحالية مطلوبة'),
    newPassword: z
      .string({ error: 'كلمة المرور الجديدة مطلوبة' })
      .min(8, 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل')
      .max(72, 'كلمة المرور الجديدة طويلة جداً (الحد 72 حرفاً)'),
    confirmPassword: z
      .string({ error: 'تأكيد كلمة المرور مطلوب' })
      .min(1, 'تأكيد كلمة المرور مطلوب'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'تأكيد كلمة المرور غير مطابق لكلمة المرور الجديدة',
    path: ['confirmPassword'],
  });

/* ============================================================================
 * updateProfile — تحديث بيانات الملف الشخصي (تحديث جزئي)
 * ========================================================================== */

export async function updateProfile(data: unknown): Promise<AuthActionState> {
  // 1) الجلسة — داخل الإجراء (دفاع متعدد الطبقات)
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return {
      success: false,
      message: 'سجّل دخولك أولاً لتحديث ملفك الشخصي',
      redirectTo: '/login',
    };
  }

  // 2) التحقق من المدخلات
  const parsed = updateProfileSchema.safeParse(normalizeProfileInput(data));
  if (!parsed.success) {
    return { success: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const input = parsed.data;

  // 3) بناء التحديث الجزئي — المفتاح الغائب لا يُمسّ أبداً
  const updates: Partial<typeof users.$inferInsert> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.phone !== undefined) updates.phone = input.phone;
  if (input.city !== undefined) updates.city = input.city;
  if (input.preferredCurrency !== undefined) {
    updates.preferredCurrency = input.preferredCurrency;
  }
  if (input.notifyEmail !== undefined) updates.notifyEmail = input.notifyEmail;
  if (input.notifySms !== undefined) updates.notifySms = input.notifySms;

  // المعلومات المهنية متاحة للمستقل أساساً، لكن لا نمنع التخزين للعميل (الترقية)
  if (input.skills !== undefined) updates.skills = input.skills;
  if (input.bio !== undefined) updates.bio = input.bio;
  if (input.hourlyRate !== undefined) {
    updates.hourlyRate = input.hourlyRate === null ? null : toNumeric(input.hourlyRate);
  }
  if (input.avatarUrl !== undefined) updates.avatarUrl = input.avatarUrl;

  if (Object.keys(updates).length === 0) {
    return { success: true, message: 'لا توجد تغييرات لحفظها' };
  }

  // 4) التنفيذ — القيود في قاعدة البيانات خط الدفاع الأخير
  try {
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, currentUser.id))
      .returning({ id: users.id });

    if (!updated) {
      return {
        success: false,
        message: 'تعذّر العثور على حسابك — سجّل دخولك من جديد',
      };
    }

    revalidatePath('/dashboard/profile');
    revalidatePath('/dashboard/settings');
    return { success: true, message: 'تم حفظ التغييرات بنجاح' };
  } catch (error) {
    console.error('updateProfile failed:', error);
    return {
      success: false,
      message: 'حدث خطأ غير متوقع أثناء حفظ التغييرات — حاول مرة أخرى',
    };
  }
}

/* ============================================================================
 * updatePassword — تغيير كلمة المرور
 * ========================================================================== */

export async function updatePassword(data: unknown): Promise<AuthActionState> {
  // 1) الجلسة — داخل الإجراء (دفاع متعدد الطبقات)
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return {
      success: false,
      message: 'سجّل دخولك أولاً لتغيير كلمة المرور',
      redirectTo: '/login',
    };
  }

  // 2) التحقق من المدخلات
  const parsed = updatePasswordSchema.safeParse(normalizeInput(data));
  if (!parsed.success) {
    return { success: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const { currentPassword, newPassword } = parsed.data;

  // 3) جلب التجزئة الحالية والتحقق منها
  const [account] = await db
    .select({ password: users.password })
    .from(users)
    .where(eq(users.id, currentUser.id))
    .limit(1);

  if (!account) {
    return {
      success: false,
      message: 'تعذّر العثور على حسابك — سجّل دخولك من جديد',
    };
  }

  const isCurrentPasswordValid = await verifyPassword(
    currentPassword,
    account.password,
  );
  if (!isCurrentPasswordValid) {
    return {
      success: false,
      fieldErrors: { currentPassword: ['كلمة المرور الحالية غير صحيحة'] },
    };
  }

  // 4) رفض إعادة استخدام الكلمة نفسها — رسالة ودّية بدل الصمت
  const isSameAsCurrent = await verifyPassword(newPassword, account.password);
  if (isSameAsCurrent) {
    return {
      success: false,
      fieldErrors: {
        newPassword: ['كلمة المرور الجديدة يجب أن تختلف عن الحالية'],
      },
    };
  }

  // 5) التجزئة والتحديث
  try {
    const passwordHash = await hashPassword(newPassword);
    const [updated] = await db
      .update(users)
      .set({ password: passwordHash })
      .where(eq(users.id, currentUser.id))
      .returning({ id: users.id });

    if (!updated) {
      return {
        success: false,
        message: 'تعذّر العثور على حسابك — سجّل دخولك من جديد',
      };
    }

    return { success: true, message: 'تم تغيير كلمة المرور بنجاح' };
  } catch (error) {
    console.error('updatePassword failed:', error);
    return {
      success: false,
      message: 'حدث خطأ غير متوقع أثناء تغيير كلمة المرور — حاول مرة أخرى',
    };
  }
}

/* ============================================================================
 * أغلفة متوافقة مع useActionState — (الحالة السابقة، FormData)
 * إجراءات خادم كاملة: تُمرَّر مباشرة إلى useActionState فتعمل النماذج
 * حتى مع تعطيل JavaScript (Progressive Enhancement).
 * ========================================================================== */

export async function updateProfileAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  return updateProfile(formData);
}

export async function updatePasswordAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  return updatePassword(formData);
}

/* ============================================================================
 * notificationPreferenceAction — إجراء نموذج مباشر (بلا useActionState)
 * لمفاتيح تفضيلات الإشعارات في صفحة الإعدادات: كل مفتاح نموذج مستقل
 * يرسل حقله فقط (تحديث جزئي). يعيد التوجيه إلى تسجيل الدخول إن انتهت
 * الجلسة — لا حالة تُعرض للعميل هنا.
 * ========================================================================== */

export async function notificationPreferenceAction(
  formData: FormData,
): Promise<void> {
  const result = await updateProfile(formData);
  if (!result.success && result.redirectTo) {
    redirect(result.redirectTo);
  }
}
