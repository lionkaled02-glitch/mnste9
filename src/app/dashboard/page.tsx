/**
 * خدمات — لوحة التحكم الرئيسية (/dashboard) — نظام موحد + #2386c8
 * - كل مستخدم له دورين (عميل + مستقل) إلا admin
 * - مؤشر إكمال الحساب للجميع: phone, bio, skills, kyc
 */

import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { users } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { getMyContracts } from '@/app/actions/contracts';
import { getDashboardStats, getLatestProjects } from '@/lib/services/dashboard';
import { getDashboardProposalCounts } from '@/lib/services/dashboard-lists';
import { getWalletOverview } from '@/lib/services/wallet';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  formatBudgetRange,
  formatDurationDays,
  PROJECT_STATUS_BADGE_CLASSES,
  PROJECT_STATUS_LABELS,
} from '@/lib/services/project-meta';

export const metadata: Metadata = {
  title: 'لوحة التحكم | خدمات',
};

export const dynamic = 'force-dynamic';

function StatCard({
  label,
  value,
  sub,
  icon,
  accent = 'blue',
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: 'blue' | 'green' | 'amber' | 'emerald';
}) {
  const accentMap = {
    blue: 'bg-[#2386c8]/10 text-[#2386c8]',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-700',
  };
  return (
    <div className="rounded-[12px] border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-[#666]">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${accentMap[accent]}`}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
            {icon}
          </svg>
        </span>
      </div>
      <div className="mt-3">
        <div className="text-[20px] font-extrabold text-[#222]">{value}</div>
        {sub && <div className="mt-1 text-[11px] text-[#888]">{sub}</div>}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <div className="rounded-[14px] border border-gray-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f5f7] text-gray-400">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </div>
        <h2 className="mt-4 text-[15px] font-bold text-[#222]">انتهت جلستك</h2>
        <p className="mt-2 text-[13px] text-[#666]">سجّل دخولك للوصول إلى لوحة التحكم</p>
        <Link href="/login" className="mt-5 inline-flex h-10 items-center justify-center rounded-[10px] bg-[#2386c8] px-6 text-[13px] font-bold text-white hover:bg-[#1a6da8]">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  const [stats, latestProjects, proposalCounts, contracts, wallet, profile] = await Promise.all([
    getDashboardStats(currentUser.id, currentUser.role as any),
    getLatestProjects(currentUser.id, currentUser.role as any, 5),
    getDashboardProposalCounts(currentUser.id, currentUser.role as any),
    getMyContracts(),
    getWalletOverview(currentUser.id),
    db
      .select({
        phone: users.phone,
        skills: users.skills,
        isKycVerified: users.isKycVerified,
        bio: users.bio,
      })
      .from(users)
      .where(eq(users.id, currentUser.id))
      .limit(1)
      .then((r) => r[0]),
  ]);

  // Unified Role: كل المستخدمين لديهم دورين
  const isAdmin = currentUser.role === 'admin';

  // Section 5: مؤشر إكمال الحساب — 4 خطوات للجميع بدون freelancerOnly
  const steps = [
    { key: 'phone', label: 'تأكيد الجوال', done: !!profile?.phone, href: '/dashboard/profile' as const },
    { key: 'bio', label: 'إضافة نبذة', done: !!profile?.bio, href: '/dashboard/profile' as const },
    { key: 'skills', label: 'إضافة المهارات', done: !!profile?.skills, href: '/dashboard/profile' as const },
    { key: 'kyc', label: 'توثيق الهوية', done: !!profile?.isKycVerified, href: '/dashboard/kyc' as const },
  ];

  const visibleSteps = steps;
  const completed = visibleSteps.filter((s) => s.done).length;
  const completionPercent = visibleSteps.length ? Math.round((completed / visibleSteps.length) * 100) : 100;

  const totalProposals = proposalCounts.all || 0;
  const acceptedProposals = proposalCounts.accepted || 0;
  const proposalsProgress = totalProposals ? Math.round((acceptedProposals / totalProposals) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-extrabold text-[#222]">مرحباً، {currentUser.name}</h1>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold border ${isAdmin ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-[#2386c8]/10 text-[#2386c8] border-[#2386c8]/20'}`}>
              {isAdmin ? 'مشرف' : 'مستخدم'}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full bg-[#2386c8] transition-all" style={{ width: `${completionPercent}%` }} />
            </div>
            <span className="text-[11px] text-[#888]">اكتمال الحساب {completionPercent}%</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/projects/new" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] bg-[#2386c8] px-5 text-[13px] font-bold text-white shadow-sm hover:bg-[#1a6da8]">
            <span className="text-[16px]">+</span>أضف مشروع
          </Link>
          <Link href="/dashboard/wallet" className="inline-flex h-10 items-center justify-center rounded-[10px] border border-gray-200 bg-white px-4 text-[13px] font-bold text-[#444] hover:border-[#222] hover:text-[#222]">
            المحفظة
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="الرصيد المتاح"
          value={formatCurrency(wallet.balance, 'USD')}
          sub={`المحجوز ${formatCurrency(wallet.pendingBalance, 'USD')}`}
          accent="blue"
          icon={<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />}
        />
        <StatCard
          label="المشاريع النشطة"
          value={`${stats.activeProjects}`}
          sub="مشاريعك المفتوحة والجارية"
          accent="emerald"
          icon={<path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.098c0 1.036-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V14.15M15 8.625h4.5A1.875 1.875 0 0 1 21.375 10.5v3.675a1.875 1.875 0 0 1-1.875 1.875H4.5a1.875 1.875 0 0 1-1.875-1.875V10.5A1.875 1.875 0 0 1 4.5 8.625h4.5m0 0V6.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v2.25M15 8.625H9" />}
        />
        <StatCard
          label="العروض"
          value={`${stats.proposals}`}
          sub={`${proposalCounts.pending} قيد الانتظار • ${proposalCounts.accepted} مقبولة`}
          accent="amber"
          icon={<path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />}
        />
        <StatCard
          label="حالة التوثيق"
          value={profile?.isKycVerified ? 'موثق ✓' : 'غير موثق'}
          sub={profile?.isKycVerified ? 'KYC معتمد' : 'وثّق هويتك لزيادة الثقة'}
          accent={profile?.isKycVerified ? 'green' : 'amber'}
          icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-[14px] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-[#222]">العقود النشطة ({contracts.filter((c) => c.status === 'active').length})</h2>
              <Link href="/dashboard/contracts" className="text-[12px] font-bold text-[#2386c8] hover:text-[#1a6da8]">عرض الكل ←</Link>
            </div>

            {contracts.length === 0 ? (
              <div className="mt-6 rounded-[12px] border border-dashed border-gray-300 bg-[#fcfcfc] p-8 text-center">
                <p className="text-[13px] font-medium text-[#666]">لا توجد عقود حالياً</p>
                <p className="mt-1 text-[11px] text-[#999]">اقبل عرضاً لإنشاء عقد أو قدم عروضاً ليتم قبولها كعقود</p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {contracts.slice(0, 4).map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between rounded-[10px] border border-gray-100 bg-[#fcfcfc] p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-[#222] line-clamp-1">{contract.projectTitle}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${contract.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>{contract.status}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-[#888]">
                        <span>{contract.clientId === currentUser.id ? contract.freelancerName : contract.clientName}</span>
                        <span className="h-3 w-px bg-gray-200" />
                        <span dir="ltr">{formatCurrency(contract.amount, 'USD')}</span>
                        <span className="h-3 w-px bg-gray-200" />
                        <span>{formatDate(contract.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <Link href={`/dashboard/contracts/${contract.id}`} className="inline-flex h-8 items-center justify-center rounded-[8px] bg-[#222] px-3 text-[11px] font-bold text-white hover:bg-black">التفاصيل</Link>
                      <Link href="/dashboard/messages" className="inline-flex h-8 items-center justify-center rounded-[8px] border border-gray-200 bg-white px-3 text-[11px] font-bold text-[#444] hover:border-[#2386c8] hover:text-[#2386c8]">محادثة</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[14px] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-[#222]">آخر المشاريع</h2>
              <Link href="/projects" className="text-[12px] font-bold text-[#2386c8] hover:text-[#1a6da8]">تصفح المشاريع ←</Link>
            </div>

            {latestProjects.length === 0 ? (
              <p className="mt-5 rounded-[10px] border border-dashed border-gray-300 p-8 text-center text-[12px] text-[#888]">لم تنشر أي مشاريع بعد</p>
            ) : (
              <div className="mt-5 space-y-3">
                {latestProjects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`} className="flex items-center justify-between rounded-[10px] border border-gray-100 bg-white p-4 hover:border-[#2386c8]/20 hover:bg-[#2386c8]/[0.02]">
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-[#222] line-clamp-1">{project.title}</div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-[#888]">
                        <span dir="ltr">{formatBudgetRange(project.budgetMin, project.budgetMax)}</span>
                        <span>·</span>
                        <span>{formatDurationDays(project.durationDays)}</span>
                        <span>·</span>
                        <span>{formatDate(project.createdAt)}</span>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${PROJECT_STATUS_BADGE_CLASSES[project.status as keyof typeof PROJECT_STATUS_BADGE_CLASSES]}`}>{PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS]}</span>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-6 rounded-[10px] bg-[#f4f5f7] p-4">
              <div className="flex justify-between text-[11px] text-[#666]">
                <span>تقدم العروض</span>
                <span>{acceptedProposals} مقبولة من {totalProposals}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                <div className="h-full bg-[#2386c8] transition-all" style={{ width: `${proposalsProgress}%` }} />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[14px] border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-[13px] font-bold text-[#222]">إكمال الحساب</h2>
            <p className="mt-1 text-[11px] text-[#888]">أكمل خطواتك لزيادة الثقة</p>
            <div className="mt-4 space-y-2.5">
              {visibleSteps.map((step) => (
                <Link key={step.key} href={step.href} className={`flex items-center justify-between rounded-[10px] border p-3 transition ${step.done ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-white hover:border-[#2386c8]/30'}`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold ${step.done ? 'bg-emerald-600 text-white' : 'bg-[#f4f5f7] text-[#999] border border-gray-200'}`}>{step.done ? '✓' : '•'}</span>
                    <span className={`text-[12px] font-bold ${step.done ? 'text-emerald-800' : 'text-[#444]'}`}>{step.label}</span>
                  </div>
                  <span className={`text-[11px] ${step.done ? 'text-emerald-700' : 'text-[#999]'}`}>{step.done ? 'مكتمل' : 'إكمال'}</span>
                </Link>
              ))}
            </div>
            <div className="mt-5">
              <div className="flex justify-between text-[11px] text-[#666]">
                <span>التقدم</span>
                <span>{completionPercent}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                <div className="h-full bg-[#2386c8] transition-all" style={{ width: `${completionPercent}%` }} />
              </div>
            </div>
          </section>

          <section className="rounded-[14px] border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-[13px] font-bold text-[#222]">إجراءات سريعة</h2>
            <div className="mt-4 grid gap-2">
              <Link href="/projects/new" className="flex items-center gap-2 rounded-[10px] border border-gray-200 bg-white p-3 text-[12px] font-bold text-[#444] hover:border-[#2386c8] hover:text-[#2386c8]">
                <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#2386c8]/10 text-[#2386c8]">+</span>أضف مشروع جديد
              </Link>
              <Link href="/dashboard/wallet" className="flex items-center gap-2 rounded-[10px] border border-gray-200 bg-white p-3 text-[12px] font-bold text-[#444] hover:border-[#2386c8] hover:text-[#2386c8]">
                <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-emerald-50 text-emerald-600">$</span>شحن المحفظة
              </Link>
              {!profile?.isKycVerified && (
                <Link href="/dashboard/kyc" className="flex items-center gap-2 rounded-[10px] bg-amber-50 border border-amber-200 p-3 text-[12px] font-bold text-amber-800 hover:bg-amber-100">
                  <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-amber-100 text-amber-700">✓</span>توثيق الهوية
                </Link>
              )}
              <Link href="/dashboard/messages" className="flex items-center gap-2 rounded-[10px] border border-gray-200 bg-white p-3 text-[12px] font-bold text-[#444] hover:border-[#2386c8] hover:text-[#2386c8]">
                <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#f4f5f7] text-[#666]">✉</span>الرسائل
              </Link>
            </div>
          </section>

          <section className="rounded-[14px] border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-[13px] font-bold text-[#222]">الإشعارات</h2>
            <div className="mt-4 rounded-[10px] border border-dashed border-gray-300 p-6 text-center">
              <p className="text-[12px] font-medium text-[#666]">لا توجد إشعارات حالياً</p>
              <p className="mt-1 text-[11px] text-[#999]">ستظهر هنا إشعارات العروض والمعاملات</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
