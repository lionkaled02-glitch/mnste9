/**
 * ============================================================================
 *  mnste9 — خدمة معالجة الأموال (Payment Gateway Service)
 * ============================================================================
 *  المسؤوليات:
 *   - initiateDeposit: إنشاء طلب إيداع عبر PayPal أو بنك الكريمي.
 *   - processKuraimiApproval: اعتماد تحويل بنك الكريمي من قِبل الإدارة.
 *
 *  ملاحظات أمنية:
 *   - كل تحديث للأرصدة يتم داخل db.transaction لضمان الذرّية.
 *   - جميع المبالغ NUMERIC(15,2) => Drizzle يعيدها string، نحوّلها بحذر.
 *   - لا تُسجَّل بيانات حساسة في logs.
 * ============================================================================
 */

import { eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import { transactions, wallets } from '@/db/schema';
import type {
  NewTransaction,
  PaymentMethod,
} from '@/db/schema';

/* ============================================================================
 * الأنواع المساعدة
 * ========================================================================== */

export type DepositMethod = Extract<PaymentMethod, 'kuraimi' | 'paypal'>;

export interface KuraimiDepositDetails {
  referenceNumber: string;
  senderName: string;
  notes?: string;
}

export interface DepositResult {
  transactionId: number;
  status: 'pending' | 'completed';
  method: DepositMethod;
}

/* ============================================================================
 * أدوات داخلية
 * ========================================================================== */

/** تحويل string (من NUMERIC) إلى number بأمان */
const toNumber = (value: string | number): number =>
  typeof value === 'number' ? value : Number.parseFloat(value);

/** تحويل number إلى string بصيغة NUMERIC(15,2) */
const toNumeric = (value: number): string => value.toFixed(2);

/* ============================================================================
 * initiateDeposit — إنشاء طلب إيداع
 * ========================================================================== */

/**
 * إنشاء طلب إيداع جديد.
 *
 * - PayPal: ننشئ أمر دفع ونعتبر الإيداع مكتملاً (في البيئة التجريبية)،
 *   ثم نضيف المبلغ إلى الرصيد المتاح للمستخدم.
 * - الكريمي: نسجّل حركة بحالة pending تحمل رقم الحوالة واسم المحوّل،
 *   وتنتظر اعتماد الإدارة (processKuraimiApproval).
 */
export async function initiateDeposit(
  userId: number,
  amount: number,
  method: DepositMethod,
  details: KuraimiDepositDetails | Record<string, unknown> = {},
): Promise<DepositResult> {
  if (amount <= 0) {
    throw new Error('المبلغ يجب أن يكون أكبر من صفر');
  }

  return db.transaction(async (tx) => {
    /* -----------------------------------------------------------------
     * 1) PayPal — معالجة آلية كاملة
     * --------------------------------------------------------------- */
    if (method === 'paypal') {
      // هنا يوضع تكامل PayPal SDK الحقيقي (orders.create) —
      // في البيئة الحالية نعتبره مكتملاً فوراً.
      const paypalOrderId =
        (details as { orderId?: string }).orderId ?? `PP-${Date.now()}`;

      const [tx_] = await tx
        .insert(transactions)
        .values({
          userId,
          amount: toNumeric(amount),
          type: 'deposit',
          paymentMethod: 'paypal',
          status: 'completed',
          referenceId: paypalOrderId,
          meta: { provider: 'paypal', orderId: paypalOrderId },
        } satisfies NewTransaction)
        .returning({ id: transactions.id });

      await tx
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} + ${toNumeric(amount)}::numeric`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.userId, userId));

      return { transactionId: tx_.id, status: 'completed', method: 'paypal' };
    }

    /* -----------------------------------------------------------------
     * 2) الكريمي — تسجيل حركة بحالة pending
     * --------------------------------------------------------------- */
    const { referenceNumber, senderName, notes } =
      details as KuraimiDepositDetails;

    if (!referenceNumber || !senderName) {
      throw new Error(
        'رقم الحوالة واسم المحوّل مطلوبان لإيداع بنك الكريمي',
      );
    }

    const [tx_] = await tx
      .insert(transactions)
      .values({
        userId,
        amount: toNumeric(amount),
        type: 'deposit',
        paymentMethod: 'kuraimi',
        status: 'pending',
        referenceId: referenceNumber,
        meta: { senderName, notes: notes ?? null },
      } satisfies NewTransaction)
      .returning({ id: transactions.id });

    return { transactionId: tx_.id, status: 'pending', method: 'kuraimi' };
  });
}

/* ============================================================================
 * processKuraimiApproval — اعتماد تحويل بنك الكريمي
 * ========================================================================== */

/**
 * اعتماد تحويل بنك الكريمي من قِبل الإدارة.
 *
 * الخطوات:
 *   1. قفل صف المعاملة (SELECT ... FOR UPDATE) لمنع الاعتماد المزدوج.
 *   2. التأكد أن المعاملة pending وبطريقة kuraimi.
 *   3. تحويل حالتها إلى completed.
 *   4. إضافة المبلغ إلى الرصيد المتاح للمستخدم.
 */
export async function processKuraimiApproval(
  transactionId: number,
  adminId: number,
): Promise<{ success: true }> {
  return db.transaction(async (tx) => {
    /* 1) قفل صف المعاملة */
    const [record] = await tx
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .for('update');

    if (!record) throw new Error('المعاملة غير موجودة');
    if (record.paymentMethod !== 'kuraimi') {
      throw new Error('هذه المعاملة ليست تحويل بنك الكريمي');
    }
    if (record.status !== 'pending') {
      throw new Error('المعاملة ليست بحالة pending — قد تكون اعتُمدت مسبقاً');
    }

    /* 2) تحويل الحالة إلى completed */
    await tx
      .update(transactions)
      .set({
        status: 'completed',
        meta: sql`COALESCE(${transactions.meta}, '{}'::jsonb) || ${JSON.stringify({
          approvedBy: adminId,
          approvedAt: new Date().toISOString(),
        })}::jsonb`,
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, transactionId));

    /* 3) إضافة المبلغ إلى الرصيد المتاح */
    const amount = toNumber(record.amount);
    await tx
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${toNumeric(amount)}::numeric`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, record.userId));

    return { success: true };
  });
}
