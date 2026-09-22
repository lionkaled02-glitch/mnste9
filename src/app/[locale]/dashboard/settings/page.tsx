/**
 * ============================================================================
 *  mnste9 — الإعدادات (/dashboard/settings)
 * ============================================================================
 *  ثلاثة تبويبات (مواصفة المرحلة) — التنقل بينها عبر معامل URL ‎?tab=
 *  كروابط حقيقية تعمل حتى مع تعطيل JavaScript (الحالة تعيش في الرابط):
 *   - الحساب (الافتراضي): معلومات الحساب + تغيير كلمة المرور.
 *   - الأمان: حالة توثيق الهوية (KYC) + التحقق بخطوتين (2FA — عرض الحالة).
 *   - الإشعارات: مفاتيح تشغيل/إيقاف للبريد والجوال — كل مفتاح نموذج
 *     مستقل يرسل حقل تفضيله فقط (تحديث جزئي عبر updateProfile).
 *
 *  الحماية:
 *   middleware يوجّه غير المسجلين إلى /login?from=/dashboard/settings؛
 *   وهنا فحص إضافي عبر getCurrentUser (دفاع متعدد الطبقات).
 * ============================================================================
 */

import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { eq } from 'drizzle-orm';

import { notificationPreferenceAction } from '@/app/actions/profile';
import { db } from '@/db';
import { users } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { getRoleLabel, KYC_LABELS } from '@/lib/services/user-meta';
import { cn, formatDate } from '@/lib/utils';

import { PasswordForm } from './password-form';

export const metadata: Metadata = {
  title: 'الإعدادات',
};

/* ============================================================================
 * التبويبات — معامل URL ?tab= (روابط حقيقية تعمل بلا JavaScript)
 * ========================================================================== */

const SETTINGS_TABS = [
  { key: 'account', label: 'الحساب' },
  { key: 'security', label: 'الأمان' },
  { key: 'notifications', label: 'الإشعارات' },
] as const;

type SettingsTab = (typeof SETTINGS_TABS)[number]['key'];

function parseTabParam(value: string | undefined): SettingsTab {
  return value === 'security' || value === 'notifications'
    ? value
    : 'account';
}

interface SettingsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** قراءة أول قيمة لمعامل URL (يتحمّل الصيغ المتعددة القيم) */
function firstParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

/* ============================================================================
 * بطاقة «انتهت جلستك» — دفاع أخير خلف middleware
 * ========================================================================== */

function SessionExpiredCard() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-lg font-bold text-slate-800">انتهت جلستك</p>
      <p className="mt-2 text-sm leading-7 text-slate-500">
        سجّل دخولك من جديد للوصول إلى الإعدادات.
      </p>
      <Link
        href="/login?from=/dashboard/settings"
        className="mt-6 inline-block rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        تسجيل الدخول
      </Link>
    </div>
  );
}

/* ============================================================================
 * صف معلومات (بطاقة الحساب)
 * ========================================================================== */

function AccountInfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-semibold text-slate-800">{children}</dd>
    </div>
  );
}

/* ============================================================================
 * مفتاح تفضيل إشعارات — نموذج مستقل يعمل بلا JavaScript
 * ========================================================================== */

interface NotificationToggleRowProps {
  /** اسم الحقل كما يتوقعه updateProfile */
  fieldName: 'notifyEmail' | 'notifySms';
  title: string;
  description: React.ReactNode;
  enabled: boolean;
  icon: React.ReactNode;
}

function NotificationToggleRow({
  fieldName,
  title,
  description,
  enabled,
  icon,
}: NotificationToggleRowProps) {
  return (
    <form action={notificationPreferenceAction} className="py-5">
      {/* القيمة الجديدة — عكس الحالة الحالية (تحديث جزئي لحقل واحد) */}
      <input type="hidden" name={fieldName} value={enabled ? 'false' : 'true'} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              {icon}
            </svg>
          </span>
          <div>
            <p className="text-sm font-bold text-slate-800">{title}</p>
            <p className="mt-1 text-xs leading-6 text-slate-500">{description}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:justify-end">
          <span
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold',
              enabled
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-500',
            )}
          >
            {enabled ? 'مفعّل' : 'معطّل'}
          </span>
          <button
            type="submit"
            className={cn(
              'rounded-lg border px-5 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
              enabled
                ? 'border-slate-300 text-slate-600 hover:border-red-400 hover:text-red-600'
                : 'border-emerald-600 text-emerald-700 hover:bg-emerald-50',
            )}
          >
            {enabled ? 'إيقاف' : 'تشغيل'}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ============================================================================
 * الصفحة
 * ========================================================================== */

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const currentUser = await getCurrentUser();

  // دفاع أخير خلف middleware — الجلسة انتهت أو الحساب حُذف
  if (!currentUser) {
    return <SessionExpiredCard />;
  }

  const activeTab = parseTabParam(firstParam(await searchParams, 'tab'));

  const [account] = await db
    .select({
      email: users.email,
      role: users.role,
      isKycVerified: users.isKycVerified,
      createdAt: users.createdAt,
      phone: users.phone,
      notifyEmail: users.notifyEmail,
      notifySms: users.notifySms,
    })
    .from(users)
    .where(eq(users.id, currentUser.id))
    .limit(1);

  // الحساب حُذف بين الطلبين (رغم صلاحية الرمز)
  if (!account) {
    return <SessionExpiredCard />;
  }

  return (
    <div className="space-y-6">
      {/* ترويسة الصفحة */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          الإعدادات
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          إدارة بيانات حسابك وأمانه وتفضيلات إشعاراتك
        </p>
      </div>

      {/* التبويبات — روابط حقيقية عبر ?tab= */}
      <nav
        aria-label="أقسام الإعدادات"
        className="flex gap-1.5 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm"
      >
        {SETTINGS_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Link
              key={tab.key}
              href={
                tab.key === 'account'
                  ? '/dashboard/settings'
                  : `/dashboard/settings?tab=${tab.key}`
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

      {/* ==================== تبويب الحساب ==================== */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          {/* معلومات الحساب */}
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">معلومات الحساب</h2>
            <dl className="mt-2 divide-y divide-slate-100">
              <AccountInfoRow label="البريد الإلكتروني">
                <span dir="ltr">{account.email}</span>
              </AccountInfoRow>
              <AccountInfoRow label="نوع الحساب">
                {getRoleLabel(account.role)}
              </AccountInfoRow>
              <AccountInfoRow label="تاريخ الانضمام">
                {formatDate(account.createdAt)}
              </AccountInfoRow>
            </dl>
            <p className="mt-4 text-xs text-slate-400">
              لتعديل الاسم والهاتف والمدينة والعملة المفضلة راجع{' '}
              <Link
                href="/dashboard/profile"
                className="font-semibold text-emerald-700 hover:underline"
              >
                الملف الشخصي
              </Link>
              .
            </p>
          </section>

          {/* تغيير كلمة المرور */}
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">
              تغيير كلمة المرور
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              اختر كلمة مرور قوية لا تستخدمها في مواقع أخرى.
            </p>
            <div className="mt-6">
              <PasswordForm />
            </div>
          </section>
        </div>
      )}

      {/* ==================== تبويب الأمان ==================== */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* حالة KYC — القاعدة الذهبية: للمستقلين فقط (العملاء لا يحتاجون KYC) */}
          {account.role === 'freelancer' && (
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                    />
                  </svg>
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    توثيق الهوية (KYC)
                  </h2>
                  <p className="mt-1.5 text-sm leading-7 text-slate-500">
                    {account.isKycVerified
                      ? 'حسابك موثّق — يمكنك تقديم العروض واستلام الدفعات والسحب.'
                      : 'توثيق الهوية مطلوب لتقديم العروض واستلام الدفعات والسحب — ولا يُطلب للإيداع. ارفع وثائقك (أمامي/خلفي/سيلفي) من صفحة توثيق الهوية.'}
                  </p>
                  <Link
                    href="/dashboard/kyc"
                    className="mt-3 inline-block rounded-lg border border-emerald-600 px-5 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  >
                    {account.isKycVerified
                      ? 'عرض حالة التوثيق'
                      : 'اذهب إلى توثيق الهوية'}
                  </Link>
                </div>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full px-3 py-1 text-xs font-semibold',
                  account.isKycVerified
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800',
                )}
              >
                {account.isKycVerified
                  ? KYC_LABELS.verified
                  : KYC_LABELS.unverified}
              </span>
            </div>
          </section>
          )}

          {/* التحقق بخطوتين (2FA) — عرض الحالة في هذه المرحلة */}
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                    />
                  </svg>
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    التحقق بخطوتين (2FA)
                  </h2>
                  <p className="mt-1.5 text-sm leading-7 text-slate-500">
                    طبقة حماية إضافية عند تسجيل الدخول عبر تطبيق مصادقة
                    (TOTP) على جوالك.
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                غير مفعّل
              </span>
            </div>
            <div className="mt-5">
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-6 py-2.5 text-sm font-semibold text-slate-400"
              >
                التفعيل قريباً
              </button>
              <p className="mt-2 text-xs text-slate-400">
                هذه الميزة قيد التطوير وستُطلق في مرحلة قادمة.
              </p>
            </div>
          </section>
        </div>
      )}

      {/* ==================== تبويب الإشعارات ==================== */}
      {activeTab === 'notifications' && (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">تفضيلات الإشعارات</h2>
          <p className="mt-1 text-sm text-slate-500">
            اختر قنوات استقبال تحديثات العروض والمعاملات المهمة.
          </p>

          <div className="mt-3 divide-y divide-slate-100">
            {/* إشعارات البريد الإلكتروني */}
            <NotificationToggleRow
              fieldName="notifyEmail"
              title="الإشعارات عبر البريد الإلكتروني"
              description={
                <>
                  تحديثات العروض والمعاملات تصلك على{' '}
                  <span dir="ltr" className="font-semibold text-slate-700">
                    {account.email}
                  </span>
                  .
                </>
              }
              enabled={account.notifyEmail}
              icon={
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                />
              }
            />

            {/* إشعارات الجوال (SMS) */}
            <NotificationToggleRow
              fieldName="notifySms"
              title="إشعارات الجوال (SMS)"
              description={
                account.phone ? (
                  <>
                    رسائل نصية قصيرة إلى{' '}
                    <span dir="ltr" className="font-semibold text-slate-700">
                      {account.phone}
                    </span>
                    .
                  </>
                ) : (
                  <>
                    أضف رقم هاتفك من{' '}
                    <Link
                      href="/dashboard/profile"
                      className="font-semibold text-emerald-700 hover:underline"
                    >
                      الملف الشخصي
                    </Link>{' '}
                    لتلقي إشعارات الجوال.
                  </>
                )
              }
              enabled={account.notifySms}
              icon={
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
                />
              }
            />
          </div>
        </section>
      )}
    </div>
  );
}
