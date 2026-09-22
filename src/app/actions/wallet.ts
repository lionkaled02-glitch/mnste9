'use server';

/**
 * ============================================================================
 *  mnste9 — إجراءات المحفظة (Server Actions) — المرحلة 10 نهائي
 * ============================================================================
 *  التحسينات:
 *   - الإيداع: مبلغ + طريقة (kuraimi/paypal) + رقم الحوالة (reference_id)
 *   - السحب: مبلغ + طريقة + حقول شرطية:
 *       kuraimi: accountNumber + accountHolderName
 *       paypal: paypalEmail
 *   - الحالة pending ولا يضاف للرصيد حتى يعتمدها المشرف.
 *   - KYC للمستقلين فقط (السحب يتطلب KYC للمستقل فقط).
 * ============================================================================
 */

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { db } from '@/db';
import { transactions, users, wallets } from '@/db/schema';
import { getCurrentUser, type AuthActionState } from '@/lib/auth';
import { toNumeric } from '@/lib/utils';

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

const MAX_AMOUNT = 9_999_999_999;
const MIN_AMOUNT = 1;
const REFERENCE_PATTERN = /^[A-Za-z0-9\-/]{4,50}$/;

const amountSchema = z.preprocess(
  emptyToUndefined,
  z.coerce.number({ error: 'المبلغ مطلوب' }).min(MIN_AMOUNT, 'المبلغ يجب أن يكون دولاراً واحداً على الأقل').max(MAX_AMOUNT, 'المبلغ كبير جداً'),
);

const paymentMethodSchema = z.enum(['kuraimi', 'paypal'], { error: 'اختر طريقة دفع صحيحة' });

const depositSchema = z.object({
  amount: amountSchema,
  paymentMethod: paymentMethodSchema,
  referenceNumber: z
    .string({ error: 'رقم الحوالة مطلوب' })
    .trim()
    .regex(REFERENCE_PATTERN, 'رقم الحوالة غير صالح — من 4 إلى 50 حرفاً/رقماً'),
  senderName: z.string().trim().max(100, 'اسم المُحوِّل طويل جداً').optional(),
});

const withdrawBase = z.object({
  amount: amountSchema,
  paymentMethod: paymentMethodSchema,
});

const withdrawKuraimiSchema = withdrawBase.extend({
  accountNumber: z
    .string({ error: 'رقم الحساب مطلوب' })
    .trim()
    .min(4, 'رقم الحساب قصير جداً')
    .max(50, 'رقم الحساب طويل جداً'),
  accountHolderName: z
    .string({ error: 'اسم صاحب الحساب مطلوب' })
    .trim()
    .min(2, 'اسم صاحب الحساب قصير جداً')
    .max(100, 'اسم صاحب الحساب طويل جداً'),
});

const withdrawPaypalSchema = withdrawBase.extend({
  paypalEmail: z.string({ error: 'بريد PayPal مطلوب' }).trim().email('بريد PayPal غير صالح').max(255),
});

interface WalletUser {
  ok: true;
  userId: number;
  role: string;
  isKycVerified: boolean;
}

async function requireWalletUser(): Promise<WalletUser | { ok: false; state: AuthActionState }> {
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
    .select({ role: users.role, isKycVerified: users.isKycVerified })
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

  return {
    ok: true,
    userId: currentUser.id,
    role: account.role,
    isKycVerified: account.isKycVerified,
  };
}

export async function requestDeposit(data: unknown): Promise<AuthActionState> {
  const gate = await requireWalletUser();
  if (!gate.ok) return gate.state;

  const parsed = depositSchema.safeParse(normalizeInput(data));
  if (!parsed.success) {
    return { success: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  try {
    await db.insert(transactions).values({
      userId: gate.userId,
      amount: toNumeric(parsed.data.amount),
      type: 'deposit',
      paymentMethod: parsed.data.paymentMethod as any,
      status: 'pending',
      referenceId: parsed.data.referenceNumber,
      meta: parsed.data.senderName ? { senderName: parsed.data.senderName } : null,
    });

    revalidatePath('/dashboard/wallet');
    return {
      success: true,
      message: 'تم تسجيل طلب الإيداع — الحالة pending بانتظار اعتماد المشرف',
    };
  } catch (error) {
    console.error('requestDeposit failed:', error);
    return {
      success: false,
      message: 'حدث خطأ غير متوقع أثناء تسجيل الإيداع — حاول مرة أخرى',
    };
  }
}

export async function requestWithdrawal(data: unknown): Promise<AuthActionState> {
  const gate = await requireWalletUser();
  if (!gate.ok) return gate.state;

  // Unified: السحب يتطلب KYC موثق لأي مستخدم
  if (!gate.isKycVerified) {
    return {
      success: false,
      message: 'يجب توثيق هويتك أولاً للسحب — ارفع وثائقك من صفحة توثيق الهوية',
      redirectTo: '/dashboard/kyc',
    };
  }

  const raw = normalizeInput(data);
  const method = raw.paymentMethod as string;

  if (method === 'paypal') {
    const parsed = withdrawPaypalSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, fieldErrors: zodFieldErrors(parsed.error) };
    }

    const [wallet] = await db.select({ balance: wallets.balance }).from(wallets).where(eq(wallets.userId, gate.userId)).limit(1);

    const available = Number.parseFloat(wallet?.balance ?? '0.00');
    if (!Number.isFinite(available) || parsed.data.amount > available) {
      return {
        success: false,
        fieldErrors: { amount: ['المبلغ يتجاوز رصيدك المتاح'] },
      };
    }

    try {
      await db.insert(transactions).values({
        userId: gate.userId,
        amount: toNumeric(parsed.data.amount),
        type: 'withdrawal',
        paymentMethod: 'paypal',
        status: 'pending',
        meta: { paypalEmail: parsed.data.paypalEmail },
      });

      revalidatePath('/dashboard/wallet');
      return {
        success: true,
        message: 'تم تسجيل طلب السحب عبر PayPal — الحالة pending بانتظار اعتماد المشرف',
      };
    } catch (error) {
      console.error('requestWithdrawal paypal failed:', error);
      return { success: false, message: 'حدث خطأ أثناء تسجيل السحب — حاول مرة أخرى' };
    }
  } else {
    const parsed = withdrawKuraimiSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, fieldErrors: zodFieldErrors(parsed.error) };
    }

    const [wallet] = await db.select({ balance: wallets.balance }).from(wallets).where(eq(wallets.userId, gate.userId)).limit(1);

    const available = Number.parseFloat(wallet?.balance ?? '0.00');
    if (!Number.isFinite(available) || parsed.data.amount > available) {
      return {
        success: false,
        fieldErrors: { amount: ['المبلغ يتجاوز رصيدك المتاح'] },
      };
    }

    try {
      await db.insert(transactions).values({
        userId: gate.userId,
        amount: toNumeric(parsed.data.amount),
        type: 'withdrawal',
        paymentMethod: 'kuraimi',
        status: 'pending',
        meta: {
          accountNumber: parsed.data.accountNumber,
          accountHolderName: parsed.data.accountHolderName,
        },
      });

      revalidatePath('/dashboard/wallet');
      return {
        success: true,
        message: 'تم تسجيل طلب السحب عبر بنك الكريمي — الحالة pending بانتظار اعتماد المشرف',
      };
    } catch (error) {
      console.error('requestWithdrawal kuraimi failed:', error);
      return { success: false, message: 'حدث خطأ أثناء تسجيل السحب — حاول مرة أخرى' };
    }
  }
}

export async function requestDepositAction(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  return requestDeposit(formData);
}

export async function requestWithdrawalAction(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  return requestWithdrawal(formData);
}
