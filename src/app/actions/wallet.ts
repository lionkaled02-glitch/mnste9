'use server';

/**
 * ============================================================================
 *  mnste9 — إجراءات المحفظة (Server Actions)
 * ============================================================================
 *  - requestDeposit(data)  : تسجيل طلب إيداع (حوالة كريمي) — قيد الانتظار.
 *  - requestWithdrawal(data): تسجيل طلب سحب — قيد الانتظار.
 *  - requestDepositAction / requestWithdrawalAction : أغلفة useActionState.
 *
 *  قرار موثّق — لا تحويل للأرصدة هنا (مسار آمن):
 *   الإجراءان يسجّلان حركة بحالة pending فقط (كما صمّمت خدمة بوابة الدفع
 *   للمشروع: حوالة الكريمي تنتظر processKuraimiApproval من الإدارة).
 *   لا يُعدَّل أي رصيد في هذه المرحلة — الاعتماد يضيف/ينقص لاحقاً.
 *
 *  قرار موثّق — بوابة KYC:
 *   الإيداع والسحب يتطلبان توثيق الهوية (اتساقاً مع نص صفحة الإعدادات:
 *   «توثيق الهوية مطلوب للمعاملات المالية») — الفحص داخل الإجراء.
 *
 *  قرار موثّق — العملة:
 *   المحفظة مقوَّمة بالدولار (USD)؛ حقل المبلغ بالدولار، والمكافئ
 *   بالريال السعودي يعرض في البطاقة بسعر ثابت للعرض فقط.
 *
 *  قرار موثّق — PayPal:
 *   الإيداع عبر PayPal يتطلب تكامل API حقيقياً (بيانات تاجر) — يُعرض
 *   في تبويب طرق الدفع كمتاح مستقبلاً، والحالي حوالة الكريمي فقط.
 * ============================================================================
 */

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { db } from '@/db';
import { transactions, users, wallets } from '@/db/schema';
import { getCurrentUser, type AuthActionState } from '@/lib/auth';
import { toNumeric } from '@/lib/utils';

/* ============================================================================
 * أدوات داخلية (نفس نمط بقية الإجراءات)
 * ========================================================================== */

function normalizeInput(data: unknown): Record<string, unknown> {
  if (data instanceof FormData) {
    return Object.fromEntries(data.entries());
  }
  if (typeof data === 'object' && data !== null) {
    return data as Record<string, unknown>;
  }
  return {};
}

function zodFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_form');
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

/** حد أقصى مالي معقول يبقى ضمن سعة NUMERIC(15,2) — نفس حد المشاريع */
const MAX_AMOUNT = 9_999_999_999;

/** أصغر مبلغ مسموح (بالدولار) */
const MIN_AMOUNT = 1;

/** صيغة رقم حوالة الكريمي: 4-50 حرفاً/رقماً (شرطات وشروط مائلة مسموحة) */
const REFERENCE_PATTERN = /^[A-Za-z0-9\-/]{4,50}$/;

/* ============================================================================
 * مخططات التحقق (zod)
 * ========================================================================== */

const amountSchema = z.preprocess(
  emptyToUndefined,
  z
    .coerce.number({ error: 'المبلغ مطلوب' })
    .min(MIN_AMOUNT, 'المبلغ يجب أن يكون دولاراً واحداً على الأقل')
    .max(MAX_AMOUNT, 'المبلغ كبير جداً'),
);

const depositSchema = z.object({
  amount: amountSchema,
  referenceNumber: z
    .string({ error: 'رقم الحوالة مطلوب' })
    .trim()
    .regex(
      REFERENCE_PATTERN,
      'رقم الحوالة غير صالح — من 4 إلى 50 رقماً/حرفاً كما في إشعار الحوالة',
    ),
  senderName: z
    .string()
    .trim()
    .max(100, 'اسم المُحوِّل طويل جداً (الحد 100 حرف)')
    .optional(),
});

const withdrawSchema = z.object({
  amount: amountSchema,
});

/* ============================================================================
 * بوابة مشتركة: الجلسة + توثيق الهوية (KYC)
 * ========================================================================== */

async function requireKycVerified(): Promise<
  { ok: true; userId: number } | { ok: false; state: AuthActionState }
> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return {
      ok: false,
      state: {
        success: false,
        message: 'سجّل دخولك أولاً لاستخدام المحفظة',
        redirectTo: '/login',
      },
    };
  }

  const [account] = await db
    .select({ isKycVerified: users.isKycVerified })
    .from(users)
    .where(eq(users.id, currentUser.id))
    .limit(1);

  if (!account) {
    return {
      ok: false,
      state: {
        success: false,
        message: 'تعذّر العثور على حسابك — سجّل دخولك من جديد',
      },
    };
  }

  if (!account.isKycVerified) {
    return {
      ok: false,
      state: {
        success: false,
        message:
          'توثيق الهوية (KYC) مطلوب للإيداع والسحب — ارفع وثائقك من صفحة توثيق الهوية في لوحة التحكم',
      },
    };
  }

  return { ok: true, userId: currentUser.id };
}

/* ============================================================================
 * requestDeposit — تسجيل طلب إيداع (حوالة كريمي)
 * ========================================================================== */

export async function requestDeposit(
  data: unknown,
): Promise<AuthActionState> {
  // 1) الجلسة + KYC
  const gate = await requireKycVerified();
  if (!gate.ok) return gate.state;

  // 2) التحقق من المدخلات
  const parsed = depositSchema.safeParse(normalizeInput(data));
  if (!parsed.success) {
    return { success: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  // 3) تسجيل الحركة — pending بانتظار اعتماد الإدارة (لا تعديل أرصدة)
  try {
    await db.insert(transactions).values({
      userId: gate.userId,
      amount: toNumeric(parsed.data.amount),
      type: 'deposit',
      paymentMethod: 'kuraimi',
      status: 'pending',
      referenceId: parsed.data.referenceNumber,
      meta: parsed.data.senderName ? { senderName: parsed.data.senderName } : null,
    });

    revalidatePath('/dashboard/wallet');
    return {
      success: true,
      message:
        'تم تسجيل طلب الإيداع — بانتظار اعتماد الإدارة، وستظهر الحركة في تبويب المعاملات',
    };
  } catch (error) {
    console.error('requestDeposit failed:', error);
    return {
      success: false,
      message: 'حدث خطأ غير متوقع أثناء تسجيل الإيداع — حاول مرة أخرى',
    };
  }
}

/* ============================================================================
 * requestWithdrawal — تسجيل طلب سحب
 * ========================================================================== */

export async function requestWithdrawal(
  data: unknown,
): Promise<AuthActionState> {
  // 1) الجلسة + KYC
  const gate = await requireKycVerified();
  if (!gate.ok) return gate.state;

  // 2) التحقق من المدخلات
  const parsed = withdrawSchema.safeParse(normalizeInput(data));
  if (!parsed.success) {
    return { success: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  // 3) فحص الرصيد المتاح (قبل التسجيل — الخصم الفعلي عند الاعتماد لاحقاً)
  const [wallet] = await db
    .select({ balance: wallets.balance })
    .from(wallets)
    .where(eq(wallets.userId, gate.userId))
    .limit(1);

  const available = Number.parseFloat(wallet?.balance ?? '0.00');
  if (!Number.isFinite(available) || parsed.data.amount > available) {
    return {
      success: false,
      fieldErrors: {
        amount: ['المبلغ يتجاوز رصيدك المتاح — راجع بطاقة الرصيد'],
      },
    };
  }

  // 4) تسجيل الحركة — pending بانتظار معالجة الإدارة (لا تعديل أرصدة)
  try {
    await db.insert(transactions).values({
      userId: gate.userId,
      amount: toNumeric(parsed.data.amount),
      type: 'withdrawal',
      paymentMethod: 'kuraimi',
      status: 'pending',
    });

    revalidatePath('/dashboard/wallet');
    return {
      success: true,
      message:
        'تم تسجيل طلب السحب — بانتظار معالجة الإدارة، وستظهر الحركة في تبويب المعاملات',
    };
  } catch (error) {
    console.error('requestWithdrawal failed:', error);
    return {
      success: false,
      message: 'حدث خطأ غير متوقع أثناء تسجيل السحب — حاول مرة أخرى',
    };
  }
}

/* ============================================================================
 * أغلفة متوافقة مع useActionState — (الحالة السابقة، FormData)
 * ========================================================================== */

export async function requestDepositAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  return requestDeposit(formData);
}

export async function requestWithdrawalAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  return requestWithdrawal(formData);
}
