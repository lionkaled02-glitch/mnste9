/**
 * ============================================================================
 *  mnste9 — استعلامات المحفظة (طبقة خدمات — للخادم فقط)
 * ============================================================================
 *  الدوال المصدَّرة:
 *   - getWalletOverview(userId)  : الرصيدان (متاح + محجوز) مع المكافئ SAR.
 *   - getWalletTransactions(userId, limit) : آخر الحركات المالية.
 *
 *  قرارات موثّقة:
 *   - الأرصدة NUMERIC(15,2) بلا عمود عملة في المخطط — المنصة تقوّمها
 *     بالدولار (USD) اتساقاً مع المراحل السابقة، والبطاقة الرئيسية تعرض
 *     المكافئ بالريال السعودي (SAR) بسعر ثابت للعرض فقط (3.75).
 *   - غياب صف المحفظة (حالة نظرية — التسجيل ينشئها في نفس المعاملة)
 *     يُعامَل كرصيد صفري بدل الانهيار.
 * ============================================================================
 */

import { desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { transactions, wallets } from '@/db/schema';

/** نظرة عامة على المحفظة */
export interface WalletOverview {
  /** الرصيد المتاح (نص NUMERIC كما تعيده القاعدة — بالدولار) */
  balance: string;
  /** المحتجز كضمان (Escrow) */
  pendingBalance: string;
}

/** صف حركة مالية في قائمة المعاملات */
export interface WalletTransactionItem {
  id: number;
  amount: string;
  type: string;
  paymentMethod: string | null;
  status: string;
  referenceId: string | null;
  createdAt: Date;
}

/** رصيد صفري آمن عند غياب صف المحفظة */
const ZERO = '0.00';

/** الرصيدان (متاح + محجوز) لمستخدم — بلا هدر: استعلام واحد */
export async function getWalletOverview(
  userId: number,
): Promise<WalletOverview> {
  const [wallet] = await db
    .select({
      balance: wallets.balance,
      pendingBalance: wallets.pendingBalance,
    })
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .limit(1);

  return {
    balance: wallet?.balance ?? ZERO,
    pendingBalance: wallet?.pendingBalance ?? ZERO,
  };
}

/** آخر الحركات المالية للمستخدم (الأحدث أولاً) */
export async function getWalletTransactions(
  userId: number,
  limit = 50,
): Promise<WalletTransactionItem[]> {
  return db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      type: transactions.type,
      paymentMethod: transactions.paymentMethod,
      status: transactions.status,
      referenceId: transactions.referenceId,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}
