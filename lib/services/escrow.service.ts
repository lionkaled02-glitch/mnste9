/**
 * ============================================================================
 *  mnste9 — خدمة الضامن المالي (Escrow Service)
 * ============================================================================
 *  المسؤوليات:
 *   - lockFunds: حجز مبلغ من العميل لصالح مشروع (نقل من balance إلى
 *     pending_balance) وتسجيل حركة escrow_lock.
 *   - releaseFunds: تحرير الأموال لصالح المستقل مع خصم عمولة المنصة،
 *     وإكمال المشروع.
 *
 *  ملاحظات:
 *   - كل العمليات داخل db.transaction لضمان الذرّية.
 *   - نستخدم SELECT ... FOR UPDATE لتجنب سباقات الحجز.
 *   - المبالغ NUMERIC(15,2) => نتعامل معها كـ string عبر toNumeric.
 * ============================================================================
 */

import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import {
  projects,
  transactions,
  wallets,
  type NewTransaction,
} from '@/db/schema';

/* ============================================================================
 * أدوات داخلية
 * ========================================================================== */

const toNumber = (value: string | number): number =>
  typeof value === 'number' ? value : Number.parseFloat(value);

const toNumeric = (value: number): string => value.toFixed(2);

/* ============================================================================
 * lockFunds — حجز مبلغ لصالح مشروع
 * ========================================================================== */

/**
 * حجز مبلغ من رصيد العميل لصالح مشروع معين.
 *
 * الخطوات:
 *   1. قفل محفظة العميل.
 *   2. التحقق من كفاية الرصيد المتاح.
 *   3. خصم المبلغ من balance وإضافته إلى pending_balance.
 *   4. تسجيل حركة escrow_lock بحالة completed.
 */
export async function lockFunds(
  clientId: number,
  projectId: number,
  amount: number,
): Promise<{ transactionId: number }> {
  if (amount <= 0) {
    throw new Error('المبلغ يجب أن يكون أكبر من صفر');
  }

  return db.transaction(async (tx) => {
    /* 1) قفل محفظة العميل */
    const [wallet] = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.userId, clientId))
      .for('update');

    if (!wallet) throw new Error('محفظة العميل غير موجودة');

    const balance = toNumber(wallet.balance);
    if (balance < amount) {
      throw new Error(
        `الرصيد المتاح غير كافٍ — المتاح ${balance} والمطلوب ${amount}`,
      );
    }

    /* 2) تحديث المحفظة */
    await tx
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} - ${toNumeric(amount)}::numeric`,
        pendingBalance: sql`${wallets.pendingBalance} + ${toNumeric(amount)}::numeric`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.id, wallet.id));

    /* 3) تسجيل الحركة */
    const [record] = await tx
      .insert(transactions)
      .values({
        userId: clientId,
        amount: toNumeric(amount),
        type: 'escrow_lock',
        paymentMethod: null,
        status: 'completed',
        referenceId: `ESCROW-${projectId}`,
        meta: { projectId, action: 'lock' },
      } satisfies NewTransaction)
      .returning({ id: transactions.id });

    return { transactionId: record.id };
  });
}

/* ============================================================================
 * releaseFunds — تحرير المبلغ للمستقل مع خصم العمولة
 * ========================================================================== */

/**
 * تحرير الأموال للمستقل عند اكتمال المشروع.
 *
 * الخطوات:
 *   1. احتساب عمولة المنصة (default 15%).
 *   2. تسجيل حركة commission.
 *   3. تسجيل حركة escrow_release بحالة completed.
 *   4. إضافة صافي المبلغ إلى الرصيد المتاح للمستقل.
 *   5. تحويل المشروع إلى completed.
 */
export async function releaseFunds(
  freelancerId: number,
  projectId: number,
  totalAmount: number,
  commissionRate = 0.15,
): Promise<{
  commission: number;
  netAmount: number;
  releaseTransactionId: number;
}> {
  if (totalAmount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر');
  if (commissionRate < 0 || commissionRate >= 1) {
    throw new Error('نسبة العمولة يجب أن تكون بين 0 و 1');
  }

  return db.transaction(async (tx) => {
    /* 1) احتساب العمولة والصافي */
    const commission = +(totalAmount * commissionRate).toFixed(2);
    const netAmount = +(totalAmount - commission).toFixed(2);

    /* 2) حركة العمولة */
    await tx
      .insert(transactions)
      .values({
        userId: freelancerId,
        amount: toNumeric(commission),
        type: 'commission',
        paymentMethod: null,
        status: 'completed',
        referenceId: `COMMISSION-${projectId}`,
        meta: { projectId, rate: commissionRate },
      } satisfies NewTransaction);

    /* 3) حركة التحرير */
    const [releaseTx] = await tx
      .insert(transactions)
      .values({
        userId: freelancerId,
        amount: toNumeric(netAmount),
        type: 'escrow_release',
        paymentMethod: null,
        status: 'completed',
        referenceId: `ESCROW-${projectId}`,
        meta: { projectId, action: 'release', totalAmount },
      } satisfies NewTransaction)
      .returning({ id: transactions.id });

    /* 4) إضافة الصافي إلى رصيد المستقل */
