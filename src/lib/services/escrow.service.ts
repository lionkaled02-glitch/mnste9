/**
 * ============================================================================
 *  mnste9 — خدمة الضامن المالي (Escrow Service) — المرحلة 9 (مواصفة دقيقة)
 * ============================================================================
 *  المسؤوليات:
 *   - lockFunds: حجز مبلغ من العميل لصالح مشروع (نقل من balance إلى
 *     pending_balance) وتسجيل حركة escrow_lock.
 *   - releaseFunds: تحرير الأموال لصالح المستقل مع خصم عمولة المنصة،
 *     باستخدام commission_rate المحفوظ في جدول contracts نفسه
 *     (القاعدة الذهبية للمرحلة 9).
 *
 *  المواصفة الدقيقة للمرحلة 9:
 *   - جدول contracts يحتوي: amount, commission_rate DEFAULT 0.15,
 *     commission, net_amount, status, escrow_locked_at, released_at.
 *   - عند الإنشاء: commission = amount * commission_rate,
 *     net_amount = amount - commission.
 *   - عند التحرير: يُستخدم commission_rate من العقد نفسه، ويُحدَّث
 *     released_at و status=completed.
 * ============================================================================
 */

import { eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import {
  contracts,
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

/** النسبة الافتراضية للعمولة (15%) — تُستخدم عند إنشاء العقد */
export const ESCROW_DEFAULT_COMMISSION = 0.15;

/* ============================================================================
 * lockFunds — حجز مبلغ لصالح مشروع
 * ========================================================================== */

export async function lockFunds(
  clientId: number,
  projectId: number,
  amount: number,
): Promise<{ transactionId: number }> {
  if (amount <= 0) {
    throw new Error('المبلغ يجب أن يكون أكبر من صفر');
  }

  return db.transaction(async (tx) => {
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

    await tx
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} - ${toNumeric(amount)}::numeric`,
        pendingBalance: sql`${wallets.pendingBalance} + ${toNumeric(amount)}::numeric`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.id, wallet.id));

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
 * releaseFunds — تحرير المبلغ باستخدام commission_rate من العقد
 * ========================================================================== */

/**
 * تحرير الأموال للمستقل عند اكتمال المشروع باستخدام نسبة العمولة
 * المحفوظة في جدول contracts (commission_rate).
 *
 * المواصفة: العقد يحتوي commission و net_amount مخزنان مسبقاً، لكن
 * الخدمة تعيد احتسابهما من commission_rate لضمان استخدام النسبة من العقد.
 */
export async function releaseFunds(
  contractId: number,
): Promise<{
  commission: number;
  netAmount: number;
  releaseTransactionId: number;
}> {
  return db.transaction(async (tx) => {
    const [contract] = await tx
      .select()
      .from(contracts)
      .where(eq(contracts.id, contractId))
      .for('update');

    if (!contract) throw new Error('العقد غير موجود');
    if (contract.status !== 'active') {
      throw new Error('العقد ليس في حالة نشطة — لا يمكن تحرير الدفعة');
    }

    const totalAmount = toNumber(contract.amount);
    const commissionRate = toNumber(contract.commissionRate);

    if (totalAmount <= 0) throw new Error('مبلغ العقد غير صالح');
    if (commissionRate < 0 || commissionRate > 1) {
      throw new Error('نسبة العمولة في العقد غير صالحة');
    }

    // استخدام commission_rate من العقد نفسه (القاعدة الذهبية)
    // حتى لو كانت commission و net_amount مخزنة، نعيد الحساب من النسبة
    const commission = +(totalAmount * commissionRate).toFixed(2);
    const netAmount = +(totalAmount - commission).toFixed(2);

    // قفل المحافظ
    const [clientWallet] = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.userId, contract.clientId))
      .for('update');

    const [freelancerWallet] = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.userId, contract.freelancerId))
      .for('update');

    if (!clientWallet) throw new Error('محفظة العميل غير موجودة');
    if (!freelancerWallet) throw new Error('محفظة المستقل غير موجودة');

    const clientPending = toNumber(clientWallet.pendingBalance);
    if (clientPending < totalAmount) {
      throw new Error(
        `الرصيد المحجوز للعميل غير كافٍ — المحجوز ${clientPending} والمطلوب ${totalAmount}`,
      );
    }

    // حركة العمولة
    await tx.insert(transactions).values({
      userId: contract.freelancerId,
      amount: toNumeric(commission),
      type: 'commission',
      paymentMethod: null,
      status: 'completed',
      referenceId: `COMMISSION-${contract.projectId}`,
      meta: {
        projectId: contract.projectId,
        contractId: contract.id,
        rate: commissionRate,
      },
    } satisfies NewTransaction);

    // حركة التحرير
    const [releaseTx] = await tx
      .insert(transactions)
      .values({
        userId: contract.freelancerId,
        amount: toNumeric(netAmount),
        type: 'escrow_release',
        paymentMethod: null,
        status: 'completed',
        referenceId: `ESCROW-${contract.projectId}`,
        meta: {
          projectId: contract.projectId,
          contractId: contract.id,
          action: 'release',
          totalAmount,
          commissionRate,
        },
      } satisfies NewTransaction)
      .returning({ id: transactions.id });

    // إضافة الصافي إلى رصيد المستقل
    await tx
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${toNumeric(netAmount)}::numeric`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, contract.freelancerId));

    // خصم الإجمالي من المحجوز للعميل
    await tx
      .update(wallets)
      .set({
        pendingBalance: sql`${wallets.pendingBalance} - ${toNumeric(totalAmount)}::numeric`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, contract.clientId));

    // تحويل المشروع إلى completed
    await tx
      .update(projects)
      .set({ status: 'completed', updatedAt: new Date() })
      .where(eq(projects.id, contract.projectId));

    // تحويل العقد إلى completed مع حفظ released_at
    await tx
      .update(contracts)
      .set({
        status: 'completed',
        releasedAt: new Date(),
        commission: toNumeric(commission),
        netAmount: toNumeric(netAmount),
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, contract.id));

    return {
      commission,
      netAmount,
      releaseTransactionId: releaseTx.id,
    };
  });
}

/* ============================================================================
 * refundEscrow — استرجاع المبلغ المحجوز للعميل
 * ========================================================================== */

export async function refundEscrow(
  clientId: number,
  projectId: number,
  amount: number,
): Promise<{ transactionId: number }> {
  if (amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر');

  return db.transaction(async (tx) => {
    const [wallet] = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.userId, clientId))
      .for('update');

    if (!wallet) throw new Error('محفظة العميل غير موجودة');

    await tx
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${toNumeric(amount)}::numeric`,
        pendingBalance: sql`${wallets.pendingBalance} - ${toNumeric(amount)}::numeric`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.id, wallet.id));

    const [record] = await tx
      .insert(transactions)
      .values({
        userId: clientId,
        amount: toNumeric(amount),
        type: 'escrow_release',
        paymentMethod: null,
        status: 'completed',
        referenceId: `ESCROW-${projectId}`,
        meta: { projectId, action: 'refund' },
      } satisfies NewTransaction)
      .returning({ id: transactions.id });

    return { transactionId: record.id };
  });
}
