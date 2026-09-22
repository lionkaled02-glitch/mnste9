/**
 * ============================================================================
 *  mnste9 — المحفظة (/dashboard/wallet)
 * ============================================================================
 *  البطاقة الرئيسية (مواصفة المرحلة): الرصيد المتاح بالدولار + المكافئ
 *  بالريال السعودي (سعر عرض ثابت 3.75) + المحتجز في الضمان.
 *
 *  أربعة تبويبات (‎?tab=‎ روابط تعمل بلا JavaScript):
 *   الرصيد | المعاملات | طرق الدفع | الإعدادات المالية
 *   وأزرار «إيداع» و«سحب» على تبويب الرصيد تفتح نموذج التسجيل
 *   (‎?action=deposit|withdraw) — الحركة تُسجَّل pending ولا يُعدَّل أي رصيد
 *   قبل اعتماد الإدارة (مسار بنك الكريمي الآمن).
 *
 *  الحماية: middleware + فحص إضافي عبر getCurrentUser (دفاع متعدد الطبقات).
 * ============================================================================
 */

import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { users } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import {
  PAYMENT_METHOD_LABELS,
  TRANSACTION_STATUS_BADGE_CLASSES,
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_TYPE_LABELS,
  USD_TO_SAR_RATE,
  WALLET_TABS,
  parseWalletTab,
} from '@/lib/services/wallet-meta';
import {
  getWalletOverview,
  getWalletTransactions,
  type WalletTransactionItem,
} from '@/lib/services/wallet';
import { PREFERRED_CURRENCY_OPTIONS } from '@/lib/services/user-meta';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

import { DepositForm, WithdrawForm } from './wallet-forms';

export const metadata: Metadata = {
  title: 'المحفظة',
};

interface WalletPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

/** صف حركة مالية (تبويب المعاملات) */
function TransactionRow({ item }: { item: WalletTransactionItem }) {
  return (
    <li className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-semibold text-slate-800">
          {TRANSACTION_TYPE_LABELS[item.type] ?? item.type}
          {item.paymentMethod && (
            <span className="ms-2 text-xs font-medium text-slate-400">
              عبر {PAYMENT_METHOD_LABELS[item.paymentMethod] ?? item.paymentMethod}
            </span>
          )}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          <span>{formatDate(item.createdAt)}</span>
          {item.referenceId && (
            <>
              <span aria-hidden="true">·</span>
              <span dir="ltr">مرجع: {item.referenceId}</span>
            </>
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
        <p
          dir="ltr"
          className={cn(
            'text-base font-bold',
            item.type === 'deposit' || item.type === 'escrow_release'
              ? 'text-emerald-700'
              : 'text-slate-900',
          )}
        >
          {item.type === 'deposit' || item.type === 'escrow_release' ? '+' : '−'}
          {formatCurrency(item.amount, 'USD')}
        </p>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-semibold',
            TRANSACTION_STATUS_BADGE_CLASSES[item.status] ??
              'bg-slate-100 text-slate-600',
          )}
        >
          {TRANSACTION_STATUS_LABELS[item.status] ?? item.status}
        </span>
      </div>
    </li>
  );
}

export default async function WalletPage({ searchParams }: WalletPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-bold text-slate-800">انتهت جلستك</p>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          سجّل دخولك من جديد للوصول إلى محفظتك.
        </p>
        <Link
          href="/login?from=/dashboard/wallet"
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  const resolved = await searchParams;
  const activeTab = parseWalletTab(firstParam(resolved, 'tab'));
  const formAction = firstParam(resolved, 'action');
  const showDepositForm = activeTab === 'balance' && formAction === 'deposit';
  const showWithdrawForm = activeTab === 'balance' && formAction === 'withdraw';

  const [overview, transactionsList, [account]] = await Promise.all([
    getWalletOverview(currentUser.id),
    getWalletTransactions(currentUser.id),
    db
      .select({
        preferredCurrency: users.preferredCurrency,
        isKycVerified: users.isKycVerified,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, currentUser.id))
      .limit(1),
  ]);

  const balanceUsd = Number.parseFloat(overview.balance);
  const sarEquivalent = balanceUsd * USD_TO_SAR_RATE;
  const preferredCurrencyLabel = account?.preferredCurrency
    ? PREFERRED_CURRENCY_OPTIONS.find(
        (option) => option.value === account.preferredCurrency,
      )?.label ?? account.preferredCurrency
    : null;

  return (
    <div className="space-y-6">
      {/* الترويسة */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          المحفظة
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          أرصدتك ومعاملاتك المالية في المنصة
        </p>
      </div>

      {/* البطاقة الرئيسية — USD + SAR + المحجوز */}
      <section className="rounded-lg border border-slate-200 bg-gradient-to-l from-emerald-600 to-emerald-700 p-6 text-white shadow-sm sm:p-8">
        <p className="text-sm font-medium text-emerald-100">الرصيد المتاح</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p dir="ltr" className="text-4xl font-bold tracking-tight">
            {formatCurrency(overview.balance, 'USD')}
          </p>
          <p dir="ltr" className="text-lg font-semibold text-emerald-100">
            ≈ {formatCurrency(sarEquivalent, 'SAR')}
          </p>
        </div>
        <p className="mt-2 text-xs text-emerald-200/80">
          المكافئ بالريال السعودي بسعر عرض ثابت (1 دولار = {USD_TO_SAR_RATE} ريال) —
          التحويل الفعلي عند الاعتماد في بنك الكريمي.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            المحجوز في الضمان:{' '}
            <span dir="ltr">{formatCurrency(overview.pendingBalance, 'USD')}</span>
          </span>
          {/* القاعدة الذهبية: شارة التوثيق للمستقلين فقط — العملاء لا يحتاجون KYC */}
          {account?.role === 'freelancer' && !account.isKycVerified && (
            <Link
              href="/dashboard/kyc"
              className="rounded-full bg-amber-400/90 px-3 py-1 text-xs font-bold text-amber-950 transition hover:bg-amber-300"
            >
              وثّق هويتك لتقديم العروض والسحب
            </Link>
          )}
        </div>

        {/* أزرار الإيداع والسحب — تبويب الرصيد */}
        {activeTab === 'balance' && !showDepositForm && !showWithdrawForm && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard/wallet?action=deposit"
              className="rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-700"
            >
              إيداع
            </Link>
            <Link
              href="/dashboard/wallet?action=withdraw"
              className="rounded-lg border border-white/60 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-700"
            >
              سحب
            </Link>
          </div>
        )}
      </section>

      {/* نموذج الإيداع / السحب (يظهر عند ?action=) */}
      {(showDepositForm || showWithdrawForm) && (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-slate-900">
            {showDepositForm ? 'إيداع عبر حوالة الكريمي' : 'سحب إلى حسابك في بنك الكريمي'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {showDepositForm
              ? 'سجّل بيانات الحوالة — تُعتمد من الإدارة ثم يُقيَّد الرصيد.'
              : 'سجّل مبلغ السحب — تُعالَج الطلبات من الإدارة وتحوَّل عبر الكريمي.'}
          </p>
          <div className="mt-6">
            {showDepositForm ? <DepositForm /> : <WithdrawForm />}
          </div>
        </section>
      )}

      {/* التبويبات — روابط حقيقية عبر ?tab= */}
      <nav
        aria-label="أقسام المحفظة"
        className="flex gap-1.5 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm"
      >
        {WALLET_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Link
              key={tab.key}
              href={
                tab.key === 'balance'
                  ? '/dashboard/wallet'
                  : `/dashboard/wallet?tab=${tab.key}`
              }
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex-1 whitespace-nowrap rounded-md px-4 py-2.5 text-center text-sm font-semibold transition',
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* ==================== تبويب الرصيد ==================== */}
      {activeTab === 'balance' && (
        <div className="grid gap-6 sm:grid-cols-2">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">الرصيد المتاح</h2>
            <p dir="ltr" className="mt-3 text-2xl font-bold text-emerald-700">
              {formatCurrency(overview.balance, 'USD')}
            </p>
            <p dir="ltr" className="mt-1 text-sm font-semibold text-slate-500">
              ≈ {formatCurrency(sarEquivalent, 'SAR')}
            </p>
            <p className="mt-3 text-xs leading-6 text-slate-400">
              متاح للاستخدام في قبول العروض والسحب.
            </p>
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">المحجوز في الضمان</h2>
            <p dir="ltr" className="mt-3 text-2xl font-bold text-slate-900">
              {formatCurrency(overview.pendingBalance, 'USD')}
            </p>
            <p className="mt-3 text-xs leading-6 text-slate-400">
              مبالغ محجوزة كضمان (Escrow) لمشاريع جارية — تُحرَّر عند
              الإنجاز وفق آلية الضمان المالي.
            </p>
          </section>
        </div>
      )}

      {/* ==================== تبويب المعاملات ==================== */}
      {activeTab === 'transactions' && (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">سجل المعاملات</h2>
          {transactionsList.length === 0 ? (
            <div className="mt-4 flex flex-col items-center rounded-lg border border-dashed border-slate-300 px-6 py-16 text-center">
              <p className="text-lg font-medium text-slate-600">
                لا توجد معاملات بعد
              </p>
              <p className="mt-2 text-sm text-slate-400">
                ستظهر هنا عمليات الإيداع والسحب والضمان فور حدوثها.
              </p>
            </div>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100">
              {transactionsList.map((item) => (
                <TransactionRow key={item.id} item={item} />
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ==================== تبويب طرق الدفع ==================== */}
      {activeTab === 'methods' && (
        <div className="grid gap-6 sm:grid-cols-2">
          {/* بنك الكريمي */}
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-900">بنك الكريمي</h2>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                متاح
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              حوالات محلية بالدولار الأمريكي (USD) والريال السعودي (SAR) —
              لا يدعم الريال اليمني.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-slate-500">
              <li>• الإيداع: حوالة ثم تسجيل رقمها للاعتماد.</li>
              <li>• السحب: تحويل إلى حسابك بعد اعتماد الطلب.</li>
            </ul>
          </section>

          {/* PayPal */}
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-900">PayPal</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                قريباً
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              إيداعات دولية بالدولار الأمريكي — يتطلب ربط حساب التاجر
              (PAYPAL_CLIENT_ID / SECRET) وسيُفعَّل في مرحلة قادمة.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-slate-500">
              <li>• الإيداع: فوري بعد اكتمام أمر الدفع.</li>
              <li>• العملة: الدولار الأمريكي فقط.</li>
            </ul>
          </section>
        </div>
      )}

      {/* ==================== تبويب الإعدادات المالية ==================== */}
      {activeTab === 'settings' && (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">الإعدادات المالية</h2>
          <dl className="mt-2 divide-y divide-slate-100">
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-slate-500">العملة المفضلة للعرض</dt>
              <dd className="text-sm font-semibold text-slate-800">
                {preferredCurrencyLabel ?? 'غير محددة بعد'}
              </dd>
            </div>
            {/* القاعدة الذهبية: صف التوثيق للمستقلين فقط — العملاء لا يحتاجون KYC */}
            {account?.role === 'freelancer' && (
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-sm text-slate-500">حالة توثيق الهوية (KYC)</dt>
                <dd className="flex items-center gap-3 text-sm font-semibold">
                  <span
                    className={
                      account.isKycVerified
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }
                  >
                    {account.isKycVerified ? 'موثّقة ✓' : 'غير موثّقة'}
                  </span>
                  <Link
                    href="/dashboard/kyc"
                    className="text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    إدارة التوثيق
                  </Link>
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-slate-500">إشعارات المعاملات</dt>
              <dd>
                <Link
                  href="/dashboard/settings?tab=notifications"
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  من تفضيلات الإشعارات
                </Link>
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-6 text-slate-400">
            لتغيير العملة المفضلة أو رقم الهاتف راجع{' '}
            <Link
              href="/dashboard/profile"
              className="font-semibold text-emerald-700 hover:underline"
            >
              الملف الشخصي
            </Link>
            . المحفظة مقوَّمة بالدولار والعملة المفضلة للعرض فقط.
          </p>
        </section>
      )}
    </div>
  );
}
