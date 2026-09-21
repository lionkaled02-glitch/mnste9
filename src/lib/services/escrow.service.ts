/**
 * ============================================================================
 *  mnste9 — خدمة الضامن المالي (Escrow Service) — المرحلة 9
 * ============================================================================
 *  المسؤوليات:
 *   - lockFunds: حجز مبلغ من العميل لصالح مشروع (نقل من balance إلى
 *     pending_balance) وتسجيل حركة escrow_lock.
 *   - releaseFunds: تحرير الأموال لصالح المستقل مع خصم عمولة المنصة،
 *     باستخدام commission_rate المحفوظ في جدول contracts نفسه
 *     (القاعدة الذهبية للمرحلة 9 — لا تُمرَّر النسبة كمعامل خارجي إلا
 *     كقيمة افتراضية عند إنشاء العقد).
 *
 *  ملاحظات:
 *   - كل العمليات داخل db.transaction لضمان الذرّية.
 *   - نستخدم SELECT ... FOR UPDATE لتجنب سباقات الحجز.
 *   - المبالغ NUMERIC(15,2) => نتعامل معها كـ string عبر toNumeric.
 *   - عند التحرير: يُخصم المبلغ من pending_balance للعميل، ويُضاف الصافي
 *     للمستقل، وتُسجَّل حركتا commission و escrow_release، ويُحدَّث العقد
 *     والمشروع.
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
 * releaseFunds — تحرير المبلغ للمستقل باستخدام commission_rate من العقد
 * ========================================================================== */

/**
 * تحرير الأموال للمستقل عند اكتمال المشروع باستخدام نسبة العمولة
 * المحفوظة في جدول contracts.
 *
 * @param contractId معرّف العقد — تُقرأ منه amount و commission_rate
 * @returns العمولة والصافي ومعرّف حركة التحرير
 *
 * الخطوات:
 *   1. قراءة العقد (amount, commission_rate, freelancer_id, client_id, project_id).
 *   2. التحقق من حالة العقد active.
 *   3. احتساب العمولة من commission_rate المخزَّن في العقد.
 *   4. داخل معاملة ذرّية:
 *      - تسجيل حركة commission.
 *      - تسجيل حركة escrow_release.
 *      - إضافة الصافي إلى رصيد المستقل.
 *      - خصم الإجمالي من pending_balance للعميل.
 *      - تحويل المشروع إلى completed.
 *      - تحويل العقد إلى completed مع حفظ release_transaction_id.
 */
export async function releaseFunds(
  contractId: number,
): Promise<{
  commission: number;
  netAmount: number;
  releaseTransactionId: number;
}> {
  return db.transaction(async (tx) => {
    /* 1) قراءة العقد مع قفل */
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
    if (commissionRate < 0 || commissionRate >= 1) {
      throw new Error('نسبة العمولة في العقد غير صالحة');
    }

    /* 2) احتساب العمولة والصافي من نسبة العقد نفسه */
    const commission = +(totalAmount * commissionRate).toFixed(2);
    const netAmount = +(totalAmount - commission).toFixed(2);

    /* 3) قفل المحافظ */
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

    /* 4) حركة العمولة */
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

    /* 5) حركة التحرير */
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

    /* 6) إضافة الصافي إلى رصيد المستقل */
    await tx
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${toNumeric(netAmount)}::numeric`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, contract.freelancerId));

    /* 7) خصم الإجمالي من المحجوز للعميل */
    await tx
      .update(wallets)
      .set({
        pendingBalance: sql`${wallets.pendingBalance} - ${toNumeric(totalAmount)}::numeric`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, contract.clientId));

    /* 8) تحويل المشروع إلى completed */
    await tx
      .update(projects)
      .set({ status: 'completed', updatedAt: new Date() })
      .where(eq(projects.id, contract.projectId));

    /* 9) تحويل العقد إلى completed مع حفظ معرّف التحرير */
    await tx
      .update(contracts)
      .set({
        status: 'completed',
        releaseTransactionId: releaseTx.id,
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
 * دوال مساعدة إضافية
 * ========================================================================== */

/** استرجاع المبلغ المحجوز للعميل (عند إلغاء المشروع) */
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
