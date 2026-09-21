/**
 * ============================================================================
 *  mnste9 — لوحة التحكم: نظرة عامة (/dashboard) — المرحلة 10 محسّنة
 * ============================================================================
 *  التحسينات (المرحلة 10):
 *   - بطاقات إحصائية (4): المشاريع النشطة، العروض، الرصيد، المحجوز.
 *   - قسم "خطوات إكمال الحساب" (جانبي): تأكيد الجوال، إضافة المهارات، توثيق الهوية.
 *   - قسم "آخر المشاريع" (أسفل): آخر 3 مشاريع.
 *   - شريط تقدم للعروض (نسبة المقبولة / الكل + شريط Tailwind).
 *   - إشعارات (فارغة حالياً).
 *
 *  الحماية: middleware + getCurrentUser
 * ============================================================================
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { users } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import {
  formatBudgetRange,
  formatDurationDays,
  formatProjectCount,
  formatProposalCount,
  PROJECT_STATUS_BADGE_CLASSES,
  PROJECT_STATUS_LABELS,
} from '@/lib/services/project-meta';
import {
  getDashboardStats,
  getLatestProjects,
  type DashboardProjectItem,
} from '@/lib/services/dashboard';
import { getDashboardProposalCounts } from '@/lib/services/dashboard-lists';
import { formatCurrency, formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'لوحة التحكم',
};

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

interface StatCardProps {
  label: string;
  value: string;
  isMoney?: boolean;
  icon: React.ReactNode;
}

function StatCard({ label, value, isMoney = false, icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
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
      </div>
      <p
        dir={isMoney ? 'ltr' : undefined}
        className={`mt-3 text-2xl font-bold text-slate-900 ${isMoney ? 'text-right' : ''}`}
      >
        {value}
      </p>
    </div>
  );
}

function LatestProjectRow({ project }: { project: DashboardProjectItem }) {
  return (
    <li>
      <Link
        href={`/projects/${project.id}`}
        className="group -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3.5 transition hover:bg-slate-50"
      >
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-800 transition group-hover:text-emerald-700">
            {project.title}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            <span dir="ltr" className="font-semibold text-slate-700">
              {formatBudgetRange(project.budgetMin, project.budgetMax)}
            </span>
            <span className="mx-1.5">·</span>
            {formatDurationDays(project.durationDays)}
            <span className="mx-1.5">·</span>
            {formatDate(project.createdAt)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${PROJECT_STATUS_BADGE_CLASSES[project.status]}`}
        >
          {PROJECT_STATUS_LABELS[project.status]}
        </span>
      </Link>
    </li>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const notice = firstParam(await searchParams, 'notice');
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-bold text-slate-800">انتهت جلستك</p>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          سجّل دخولك من جديد للوصول إلى لوحة التحكم.
        </p>
        <Link
          href="/login?from=/dashboard"
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  // جلب الإحصائيات + أحدث المشاريع + عدّادات العروض + بيانات إكمال الحساب
  const [stats, latestProjects, proposalCounts, profile] = await Promise.all([
    getDashboardStats(currentUser.id, currentUser.role),
    getLatestProjects(currentUser.id, currentUser.role, 3),
    getDashboardProposalCounts(currentUser.id, currentUser.role),
    db
      .select({
        phone: users.phone,
        skills: users.skills,
        isKycVerified: users.isKycVerified,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, currentUser.id))
      .limit(1)
      .then((r) => r[0]),
  ]);

  const isClient = currentUser.role === 'client';
  const isFreelancer = currentUser.role === 'freelancer';

  // خطوات إكمال الحساب
  const steps = [
    {
      key: 'phone',
      label: 'تأكيد رقم الجوال',
      done: Boolean(profile?.phone),
      href: '/dashboard/profile',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
        />
      ),
    },
    {
      key: 'skills',
      label: 'إضافة المهارات',
      done: Boolean(profile?.skills),
      href: '/dashboard/profile',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.25 12l2.846-.813a1.5 1.5 0 0 0 1.03-1.03L22.5 9l-1.374-1.157a1.5 1.5 0 0 0-1.03-1.03L18.25 6l-1.157 1.374a1.5 1.5 0 0 0-1.03 1.03L15.25 9l1.374 1.157a1.5 1.5 0 0 0 1.03 1.03L18.25 12Z"
        />
      ),
    },
    {
      key: 'kyc',
      label: 'توثيق الهوية',
      done: Boolean(profile?.isKycVerified),
      href: '/dashboard/kyc',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
        />
      ),
      freelancerOnly: true,
    },
  ];

  const visibleSteps = steps.filter((s) => !(s as any).freelancerOnly || isFreelancer);
  const completedSteps = visibleSteps.filter((s) => s.done).length;
  const completionPercent = visibleSteps.length
    ? Math.round((completedSteps / visibleSteps.length) * 100)
    : 100;

  // شريط تقدم العروض
  const totalProposals = proposalCounts.all || 0;
  const acceptedProposals = proposalCounts.accepted || 0;
  const proposalsProgress = totalProposals ? Math.round((acceptedProposals / totalProposals) * 100) : 0;

  const statCards: StatCardProps[] = [
    {
      label: 'المشاريع النشطة',
      value: formatProjectCount(stats.activeProjects),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 14.15v4.098c0 1.036-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V14.15M15 8.625h4.5A1.875 1.875 0 0 1 21.375 10.5v3.675a1.875 1.875 0 0 1-1.875 1.875H4.5a1.875 1.875 0 0 1-1.875-1.875V10.5A1.875 1.875 0 0 1 4.5 8.625h4.5m0 0V6.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v2.25M15 8.625H9"
        />
      ),
    },
    {
      label: isClient ? 'العروض المستلمة' : 'العروض المقدمة',
      value: formatProposalCount(stats.proposals),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
        />
      ),
    },
    {
      label: 'الرصيد المتاح',
      value: formatCurrency(stats.walletBalance, 'USD'),
      isMoney: true,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
        />
      ),
    },
    {
      label: 'المحجوز في الضمان',
      value: formatCurrency(stats.walletPendingBalance, 'USD'),
      isMoney: true,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {notice === 'kyc-freelancers-only' && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <p>
            <span className="font-bold">KYC للمستقلين فقط</span> — توثيق الهوية غير مطلوب لحسابك.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            مرحباً، {currentUser.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">نظرة سريعة على نشاطك — اكتمال حسابك {completionPercent}%</p>
        </div>
        <Link
          href={isClient ? '/projects/new' : '/projects'}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          {isClient ? 'انشر مشروعاً' : 'تصفح المشاريع'}
        </Link>
      </div>

      {/* البطاقات الإحصائية الأربع */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* شريط تقدم العروض + إكمال الحساب */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* العمود الرئيسي — آخر المشاريع + تقدم العروض */}
        <div className="space-y-6 lg:col-span-2">
          {/* شريط تقدم العروض */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">تقدم العروض</h2>
              <span className="text-xs text-slate-500">
                {acceptedProposals} مقبولة من {totalProposals}
              </span>
            </div>
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all"
                style={{ width: `${proposalsProgress}%` }}
              />
            </div>
            <div className="mt-3 flex gap-2 text-[11px]">
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                قيد الانتظار: {proposalCounts.pending}
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
                مقبولة: {proposalCounts.accepted}
              </span>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">
                مرفوضة: {proposalCounts.rejected}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                الكل: {proposalCounts.all}
              </span>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-slate-800 transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              اكتمال الملف الشخصي: {completionPercent}% — أكمل الخطوات الجانبية لزيادة فرصك.
            </p>
          </section>

          {/* آخر المشاريع — أسفل */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">آخر المشاريع</h2>
              <Link
                href="/projects"
                className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 hover:underline"
              >
                عرض الكل
              </Link>
            </div>

            {latestProjects.length === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
                {isClient ? 'لم تنشر أي مشاريع بعد.' : 'لا توجد مشاريع مفتوحة حالياً.'}
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100">
                {latestProjects.map((project) => (
                  <LatestProjectRow key={project.id} project={project} />
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* جانبي — خطوات إكمال الحساب + إشعارات */}
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">خطوات إكمال الحساب</h2>
            <p className="mt-1 text-xs text-slate-500">
              أكمل هذه الخطوات لزيادة ثقة العملاء وفرص قبول عروضك.
            </p>

            <div className="mt-5 space-y-3">
              {visibleSteps.map((step) => (
                <Link
                  key={step.key}
                  href={step.href}
                  className={`flex items-center justify-between rounded-xl border p-3.5 transition ${
                    step.done
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${
                        step.done ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {step.done ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75 7.5 15 15 9.75" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          {step.icon}
                        </svg>
                      )}
                    </span>
                    <span className={`text-sm font-semibold ${step.done ? 'text-emerald-800' : 'text-slate-700'}`}>
                      {step.label}
                    </span>
                  </div>
                  <span className={`text-xs ${step.done ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {step.done ? 'مكتمل ✓' : 'إكمال ←'}
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>التقدم</span>
                <span>{completionPercent}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">الإشعارات</h2>
            <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
              </span>
              <p className="mt-3 text-sm font-medium text-slate-600">لا توجد إشعارات حالياً</p>
              <p className="mt-1 text-xs leading-6 text-slate-400">
                ستظهر هنا إشعارات العروض والمعاملات.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
