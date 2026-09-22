/**
 * ============================================================================
 *  خدمات — المحفظة المالية (/dashboard/wallet) — إعادة تصميم 100% مستقل
 * ============================================================================
 *  - رصيد متاح + محجوز في الضمان
 *  - جدول سجل المعاملات: تاريخ، نوع، مبلغ، حالة
 *  - نموذج سحب خفيف مع اختيار الوسيلة (الكريمي / PayPal / بنكي)
 *  - Tailwind RTL + #2386c8 + i18n Link
 * ============================================================================
 */

import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { users } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { getWalletOverview, getWalletTransactions } from '@/lib/services/wallet';
import {
  PAYMENT_METHOD_LABELS,
  TRANSACTION_STATUS_BADGE_CLASSES,
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_TYPE_LABELS,
  USD_TO_SAR_RATE,
  WALLET_TABS,
  parseWalletTab,
} from '@/lib/services/wallet-meta';
import { formatCurrency, formatDate } from '@/lib/utils';

import { DepositForm, WithdrawForm } from './wallet-forms';

export const metadata: Metadata = {
  title: 'المحفظة | خدمات',
};

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = searchParams[key];
  return Array.isArray(v) ? v[0] : v;
}

export default async function WalletPage({ searchParams }: Props) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <div className="rounded-[14px] border border-gray-200 bg-white p-10 text-center shadow-sm">
        <p className="text-[15px] font-bold text-[#222]">انتهت جلستك</p>
        <Link href="/login" className="mt-5 inline-flex h-10 items-center justify-center rounded-[10px] bg-[#2386c8] px-6 text-[13px] font-bold text-white hover:bg-[#1a6da8]">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  const resolved = await searchParams;
  const activeTab = parseWalletTab(firstParam(resolved, 'tab'));
  const action = firstParam(resolved, 'action');

  const [overview, transactions, account] = await Promise.all([
    getWalletOverview(currentUser.id),
    getWalletTransactions(currentUser.id, 50),
    db
      .select({ preferredCurrency: users.preferredCurrency, isKycVerified: users.isKycVerified, role: users.role })
      .from(users)
      .where(eq(users.id, currentUser.id))
      .limit(1)
      .then((r) => r[0]),
  ]);

  const balanceUsd = Number.parseFloat(overview.balance);
  const pendingUsd = Number.parseFloat(overview.pendingBalance);
  const sarEquivalent = balanceUsd * USD_TO_SAR_RATE;

  const showDeposit = action === 'deposit';
  const showWithdraw = action === 'withdraw';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-extrabold text-[#222]">المحفظة المالية</h1>
        <p className="mt-1 text-[13px] text-[#666]">أرصدتك، معاملاتك، وطلبات السحب في مكان واحد</p>
      </div>

      {/* Balance cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-[14px] border border-[#2386c8]/20 bg-gradient-to-l from-[#2386c8] to-[#1a6da8] p-6 text-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[12px] font-medium text-white/80">الرصيد المتاح</p>
              <p dir="ltr" className="mt-2 text-[32px] font-extrabold tracking-tight">{formatCurrency(overview.balance, 'USD')}</p>
              <p dir="ltr" className="mt-1 text-[13px] font-semibold text-white/80">≈ {formatCurrency(sarEquivalent, 'SAR')}</p>
              <p className="mt-3 text-[11px] text-white/70">سعر عرض ثابت 1$ = {USD_TO_SAR_RATE} ر.س — التحويل الفعلي عند الاعتماد في بنك الكريمي</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white/15 text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75" />
              </svg>
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/dashboard/wallet?action=deposit" className="inline-flex h-9 items-center justify-center rounded-[8px] bg-white px-5 text-[12px] font-bold text-[#2386c8] hover:bg-gray-100">
              + إيداع
            </Link>
            <Link href="/dashboard/wallet?action=withdraw" className="inline-flex h-9 items-center justify-center rounded-[8px] border border-white/40 bg-transparent px-5 text-[12px] font-bold text-white hover:bg-white/10">
              سحب الأرباح
            </Link>
            {account?.role === 'freelancer' && !account.isKycVerified && (
              <Link href="/dashboard/kyc" className="inline-flex h-9 items-center justify-center rounded-[8px] bg-amber-400 px-4 text-[11px] font-bold text-amber-950 hover:bg-amber-300">
                وثّق هويتك للسحب
              </Link>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[14px] border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#666]">المحجوز في الضمان</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-amber-50 text-amber-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </span>
            </div>
            <p dir="ltr" className="mt-3 text-[20px] font-extrabold text-[#222]">{formatCurrency(overview.pendingBalance, 'USD')}</p>
            <p className="mt-2 text-[11px] leading-5 text-[#888]">مبالغ محجوزة كضمان لمشاريع جارية — تُحرر عند التسليم</p>
          </div>

          <div className="rounded-[14px] border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-[12px] font-medium text-[#666]">إجمالي الرصيد</div>
            <p dir="ltr" className="mt-2 text-[18px] font-extrabold text-[#222]">{formatCurrency(balanceUsd + pendingUsd, 'USD')}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full bg-[#2386c8]" style={{ width: `${balanceUsd + pendingUsd > 0 ? (balanceUsd / (balanceUsd + pendingUsd)) * 100 : 0}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-[#888]">
              <span>متاح {balanceUsd > 0 ? Math.round((balanceUsd / (balanceUsd + pendingUsd)) * 100) : 0}%</span>
              <span>محجوز {pendingUsd > 0 ? Math.round((pendingUsd / (balanceUsd + pendingUsd)) * 100) : 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Forms */}
      {(showDeposit || showWithdraw) && (
        <section className="rounded-[14px] border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-[#222]">{showDeposit ? 'إيداع عبر بنك الكريمي' : 'سحب الأرباح'}</h2>
            <Link href="/dashboard/wallet" className="text-[12px] font-bold text-[#666] hover:text-[#222]">إغلاق ✕</Link>
          </div>
          <p className="mt-1 text-[12px] text-[#888]">{showDeposit ? 'سجل بيانات الحوالة ليتم اعتمادها من الإدارة' : 'اختر وسيلة السحب وسجل المبلغ — تتم المعالجة خلال 24-48 ساعة'}</p>
          <div className="mt-6 max-w-xl">{showDeposit ? <DepositForm /> : <WithdrawForm />}</div>
        </section>
      )}

      {/* Tabs */}
      <nav className="flex gap-1.5 overflow-x-auto rounded-[12px] border border-gray-200 bg-white p-1.5 shadow-sm">
        {WALLET_TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Link
              key={tab.key}
              href={tab.key === 'balance' ? '/dashboard/wallet' : `/dashboard/wallet?tab=${tab.key}`}
              className={`flex-1 whitespace-nowrap rounded-[8px] px-4 py-2.5 text-center text-[12.5px] font-bold transition ${active ? 'bg-[#2386c8] text-white shadow-sm' : 'text-[#666] hover:bg-[#f4f5f7] hover:text-[#222]'}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Balance tab */}
      {activeTab === 'balance' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[12px] border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-[13px] font-bold text-[#222]">الرصيد المتاح</h3>
            <p dir="ltr" className="mt-3 text-[22px] font-extrabold text-[#2386c8]">{formatCurrency(overview.balance, 'USD')}</p>
            <p className="mt-2 text-[11px] leading-5 text-[#888]">يمكنك استخدامه لقبول العروض، إنشاء عقود، أو سحب الأرباح</p>
          </div>
          <div className="rounded-[12px] border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-[13px] font-bold text-[#222]">طرق الدفع المدعومة</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f5f7] border border-gray-200 px-3 py-1.5 text-[11px] font-bold text-[#444]"><span className="h-2 w-2 rounded-full bg-[#00a651]" />بنك الكريمي</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f5f7] border border-gray-200 px-3 py-1.5 text-[11px] font-bold text-[#444]"><span className="h-2 w-2 rounded-full bg-[#003087]" />PayPal</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f5f7] border border-gray-200 px-3 py-1.5 text-[11px] font-bold text-[#888]">تحويل بنكي</span>
            </div>
            <p className="mt-3 text-[11px] leading-5 text-[#888]">السحب متاح عبر الكريمي محلياً و PayPal عالمياً</p>
          </div>
        </div>
      )}

      {/* Transactions */}
      {activeTab === 'transactions' && (
        <section className="rounded-[14px] border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-[15px] font-bold text-[#222]">سجل المعاملات المالية</h2>
            <p className="mt-1 text-[12px] text-[#888]">آخر {transactions.length} معاملة</p>
          </div>

          {transactions.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f5f7] text-gray-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75" />
                </svg>
              </div>
              <p className="mt-3 text-[13px] font-bold text-[#444]">لا توجد معاملات بعد</p>
              <p className="mt-1 text-[12px] text-[#888]">ستظهر هنا الإيداعات والسحوبات وحركات الضمان</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-[#fcfcfc] border-b border-gray-100">
                  <tr className="text-[11px] font-bold text-[#666]">
                    <th className="px-5 py-3">التاريخ</th>
                    <th className="px-5 py-3">النوع</th>
                    <th className="px-5 py-3">الوسيلة</th>
                    <th className="px-5 py-3">المبلغ</th>
                    <th className="px-5 py-3">الحالة</th>
                    <th className="px-5 py-3">المرجع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#fcfcfc] text-[12.5px]">
                      <td className="px-5 py-3.5 text-[#666] whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${tx.type === 'deposit' ? 'bg-emerald-500' : tx.type === 'withdrawal' ? 'bg-[#e74c3c]' : tx.type === 'escrow_lock' ? 'bg-amber-500' : 'bg-[#2386c8]'}`} />
                          <span className="font-bold text-[#222]">{TRANSACTION_TYPE_LABELS[tx.type] || tx.type}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[#666]">{tx.paymentMethod ? PAYMENT_METHOD_LABELS[tx.paymentMethod] || tx.paymentMethod : '—'}</td>
                      <td className="px-5 py-3.5 font-bold" dir="ltr">
                        <span className={tx.type === 'deposit' || tx.type === 'escrow_release' ? 'text-emerald-600' : 'text-[#222]'}>
                          {tx.type === 'deposit' || tx.type === 'escrow_release' ? '+' : '-'}
                          {formatCurrency(tx.amount, 'USD')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold border ${TRANSACTION_STATUS_BADGE_CLASSES[tx.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {TRANSACTION_STATUS_LABELS[tx.status] || tx.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[11px] text-[#999]" dir="ltr">{tx.referenceId || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'methods' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[12px] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-[#222]">بنك الكريمي</h3>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-700">متاح</span>
            </div>
            <p className="mt-3 text-[12px] leading-6 text-[#666]">حوالات محلية بالدولار والريال السعودي — لا يدعم الريال اليمني. الإيداع عبر تسجيل رقم الحوالة والسحب تحويل مباشر.</p>
            <div className="mt-4 rounded-[10px] bg-[#f4f5f7] p-3 text-[11px] text-[#666]">⏱ معالجة خلال 24 ساعة • بدون عمولة محلية</div>
          </div>
          <div className="rounded-[12px] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-[#222]">PayPal</h3>
              <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[10px] font-bold text-amber-700">قريباً</span>
            </div>
            <p className="mt-3 text-[12px] leading-6 text-[#666]">إيداعات دولية بالدولار — يتطلب ربط حساب التاجر وسيُفعل قريباً. السحب عبر PayPal بعمولة 2%.</p>
            <div className="mt-4 rounded-[10px] bg-[#f4f5f7] p-3 text-[11px] text-[#666]">🌍 دولي • فوري بعد الاعتماد • USD فقط</div>
          </div>
          <div className="rounded-[12px] border border-gray-200 bg-white p-6 shadow-sm sm:col-span-2">
            <h3 className="text-[13px] font-bold text-[#222]">تحويل بنكي</h3>
            <p className="mt-2 text-[12px] leading-6 text-[#666]">خيار إضافي للشركات — تواصل مع الدعم لربط حسابك البنكي. يدعم التحويلات المحلية والدولية عبر SWIFT.</p>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="rounded-[14px] border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-[14px] font-bold text-[#222]">الإعدادات المالية</h3>
          <p className="mt-2 text-[12px] leading-6 text-[#666]">إدارة تفضيلاتك المالية. العملة المفضلة للعرض فقط — المحفظة مقومة بالدولار.</p>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-[10px] bg-[#fcfcfc] border border-gray-100 p-4">
              <span className="text-[12px] text-[#666]">العملة المفضلة</span>
              <Link href="/dashboard/profile" className="text-[12px] font-bold text-[#2386c8] hover:text-[#1a6da8]">تعديل من الملف الشخصي</Link>
            </div>
            <div className="flex items-center justify-between rounded-[10px] bg-[#fcfcfc] border border-gray-100 p-4">
              <span className="text-[12px] text-[#666]">إشعارات المعاملات</span>
              <Link href="/dashboard/settings" className="text-[12px] font-bold text-[#2386c8] hover:text-[#1a6da8]">الإعدادات</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
