'use server';

/**
 * ============================================================================
 *  mnste9 — إجراءات المصادقة (Server Actions)
 * ============================================================================
 *  - registerUser(data)      : تسجيل مستخدم جديد (zod + bcrypt + Drizzle).
 *  - loginUser(data)         : تسجيل الدخول وإصدار كوكي جلسة.
 *  - logoutUser()            : تسجيل الخروج وحذف الكوكي.
 *  - selectAccountType(data) : اختيار نوع الحساب (client / freelancer).
 *
 *  مبادئ التصميم:
 *   - كل إجراء نقطة دخول غير موثوقة (راجع توثيق Next.js) → التحقق بـ zod
 *     داخل كل إجراء دون استثناء، مع رسائل خطأ عربية ودّية.
 *   - كل إجراء يقبل FormData (من النماذج) أو كائناً عادياً (من API Routes)
 *     — واجهة واحدة تخدم المسارين.
 *   - الإجراءات تُرجع AuthActionState ولا تستدعي redirect() مباشرة كي
 *     تبقى قابلة للاستدعاء من Route Handlers؛ الصفحات تتولى التوجيه عبر
 *     state.redirectTo.
 *   - الإيميل يُطبَّع إلى أحرف صغيرة قبل التخزين (قيود UNIQUE في
 *     PostgreSQL حساسة لحالة الأحرف).
 *   - عند التسجيل: يُنشأ المستخدم بدور افتراضي 'client' (عمود role NOT
 *     NULL بقيود CHECK) مع محفظته في نفس المعاملة، ثم تُعرض صفحة اختيار
 *     نوع الحساب لتعديل الدور.
 * ============================================================================
 */

import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { users, wallets } from '@/db/schema';
import {
  clearSessionCookie,
  createSession,
  getCurrentUser,
  hashPassword,
  setSessionCookie,
  verifyPassword,
  type AuthActionState,
} from '@/lib/auth';

/* ============================================================================
 * أدوات داخلية
 * ========================================================================== */

/** تطبيع المدخلات: FormData (من النماذج) أو كائن (من API) → سجل بسيط */
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

/* ============================================================================
 * مخططات التحقق (zod)
 * ========================================================================== */

const registerSchema = z.object({
  name: z
    .string({ error: 'الاسم مطلوب' })
    .trim()
    .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
    .max(100, 'الاسم طويل جداً (الحد 100 حرف)'),
  email: z
    .email({ error: 'صيغة البريد الإلكتروني غير صحيحة' })
    .trim()
    .toLowerCase()
    .max(255, 'البريد الإلكتروني طويل جداً'),
  password: z
    .string({ error: 'كلمة المرور مطلوبة' })
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .max(72, 'كلمة المرور طويلة جداً (الحد 72 حرفاً)'),
});

const loginSchema = z.object({
  email: z
    .email({ error: 'صيغة البريد الإلكتروني غير صحيحة' })
    .trim()
    .toLowerCase(),
  password: z.string({ error: 'كلمة المرور مطلوبة' }).min(1, 'كلمة المرور مطلوبة'),
});

const accountTypeSchema = z.object({
  accountType: z.enum(['client', 'freelancer'], {
    error: 'نوع الحساب يجب أن يكون client أو freelancer',
  }),
});

/* ============================================================================
 * registerUser — تسجيل مستخدم جديد
 * ========================================================================== */

/**
 * إنشاء حساب جديد: تحقق → تجزئة كلمة المرور → (مستخدم + محفظة) داخل
 * معاملة واحدة → جلسة فورية.
 *
 * الدور الافتراضي 'client' — تُعرض صفحة اختيار نوع الحساب بعد التسجيل
 * لتعديله عبر selectAccountType.
 */
export async function registerUser(data: unknown): Promise<AuthActionState> {
  const input = normalizeInput(data);

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const { name, email, password } = parsed.data;

  try {
    /* فحص مسبق ودّي للتكرار (السباق الفعلي يحسمه قيد UNIQUE) */
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return {
        success: false,
        message: 'هذا البريد الإلكتروني مسجّل مسبقاً — جرّب تسجيل الدخول',
        fieldErrors: { email: ['هذا البريد مسجّل مسبقاً'] },
      };
    }

    const passwordHash = await hashPassword(password);

    /* إنشاء المستخدم ومحفظته ذرّياً */
    const userId = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({ name, email, password: passwordHash, role: 'client' })
        .returning({ id: users.id });

      await tx.insert(wallets).values({ userId: user.id });

      return user.id;
    });

    /* جلسة فورية بعد التسجيل */
    const token = await createSession(userId);
    await setSessionCookie(token);

    return {
      success: true,
      message: 'تم إنشاء حسابك بنجاح — مرحباً بك في mnste9',
      redirectTo: '/select-account-type',
    };
  } catch (error) {
    /* سباق INSERT: قيد UNIQUE التقط التكرار بعد الفحص المسبق */
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
    ) {
      return {
        success: false,
        message: 'هذا البريد الإلكتروني مسجّل مسبقاً — جرّب تسجيل الدخول',
        fieldErrors: { email: ['هذا البريد مسجّل مسبقاً'] },
      };
    }

    console.error('registerUser failed:', error);
    return {
      success: false,
      message: 'حدث خطأ غير متوقع أثناء إنشاء الحساب — حاول مرة أخرى',
    };
  }
}

/* ============================================================================
 * loginUser — تسجيل الدخول
 * ========================================================================== */

/**
 * تسجيل الدخول بالبريد وكلمة المرور وإصدار كوكي جلسة.
 *
 * رسالة خطأ واحدة موحّدة لكل حالات الفشل (لا كشف لوجود البريد).
 */
export async function loginUser(data: unknown): Promise<AuthActionState> {
  const input = normalizeInput(data);

  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const { email, password } = parsed.data;

  try {
    const [user] = await db
      .select({ id: users.id, password: users.password })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    /* مقارنة دائمة (حتى مع غياب المستخدم) لتوحيد زمن الاستجابة ومنع
       كشف وجود البريد عبر قياس الزمن — التجزئة الوهمية صالحة بصيغة bcrypt */
    const DUMMY_HASH = '$2b$12$dwVXwbzEyHXMLh908UYT2.S0PkDluz9jVEDTbqp3CWVCZLIpjJMSq';
    const passwordHash = user?.password ?? DUMMY_HASH;
    const valid = await verifyPassword(password, passwordHash);

    if (!user || !valid) {
      return {
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      };
    }

    const token = await createSession(user.id);
    await setSessionCookie(token);

    return {
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      redirectTo: '/dashboard',
    };
  } catch (error) {
    console.error('loginUser failed:', error);
    return {
      success: false,
      message: 'حدث خطأ غير متوقع أثناء تسجيل الدخول — حاول مرة أخرى',
    };
  }
}

/* ============================================================================
 * logoutUser — تسجيل الخروج
 * ========================================================================== */

export async function logoutUser(): Promise<AuthActionState> {
  await clearSessionCookie();
  return {
    success: true,
    message: 'تم تسجيل الخروج بنجاح',
    redirectTo: '/login',
  };
}

/* ============================================================================
 * selectAccountType — اختيار نوع الحساب
 * ========================================================================== */

/**
 * تعيين نوع الحساب: 'client' (صاحب عمل) أو 'freelancer' (مستقل).
 *
 * يتطلب جلسة صالحة — ولا يسمح أبداً بالترقية إلى 'admin' من هذه الواجهة.
 */
export async function selectAccountType(data: unknown): Promise<AuthActionState> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return {
      success: false,
      message: 'جلستك منتهية — سجّل الدخول أولاً',
      redirectTo: '/login',
    };
  }

  const input = normalizeInput(data);
  const parsed = accountTypeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  try {
    await db
      .update(users)
      .set({ role: parsed.data.accountType })
      .where(eq(users.id, currentUser.id));

    return {
      success: true,
      message:
        parsed.data.accountType === 'client'
          ? 'تم تفعيل حسابك كصاحب عمل'
          : 'تم تفعيل حسابك كمستقل',
      redirectTo: '/dashboard',
    };
  } catch (error) {
    console.error('selectAccountType failed:', error);
    return {
      success: false,
      message: 'حدث خطأ غير متوقع — حاول مرة أخرى',
    };
  }
}
