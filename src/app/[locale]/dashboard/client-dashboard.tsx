import { Link } from '@/i18n/navigation';

import { getDashboardProposalCounts } from '@/lib/services/dashboard-lists';
import { getDashboardStats, getLatestProjects } from '@/lib/services/dashboard';
import { getWalletOverview } from '@/lib/services/wallet';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  formatBudgetRange,
  formatDurationDays,
  PROJECT_STATUS_BADGE_CLASSES,
  PROJECT_STATUS_LABELS,
} from '@/lib/services/project-meta';

import { WishlistSection } from './profile/wishlist-section';

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[12px] border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
      <span className="text-[12px] font-medium text-[#666]">{label}</span>
      <div className="mt-3 text-[20px] font-extrabold text-[#222]">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-[#888]">{sub}</div>}
    </div>
  );
}

interface ClientDashboardProps {
  user: { id: number; name: string; role: string };
}

export async function ClientDashboard({ user }: ClientDashboardProps) {
  const [stats, latestProjects, proposalCounts, wallet] = await Promise.all([
    getDashboardStats(user.id, 'client' as never),
    getLatestProjects(user.id, 'client' as never, 5),
    getDashboardProposalCounts(user.id, 'client' as never),
    getWalletOverview(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-extrabold text-[#222]">مرحباً، {user.name}</h1>
            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
              صاحب عمل
            </span>
          </div>
          <p className="mt-2 text-[13px] text-[#666]">تابع مشاريعك وعروض المستقلين ومحفظتك من مكان واحد.</p>
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
        />
        <StatCard label="المشاريع النشطة" value={`${stats.activeProjects}`} sub="مشاريعك المفتوحة والجارية" />
        <StatCard label="العروض المستلمة" value={`${stats.proposals}`} sub={`${proposalCounts.pending} قيد الانتظار • ${proposalCounts.accepted} مقبولة`} />
        <StatCard label="قيد المراجعة" value={`${proposalCounts.pending}`} sub="عروض تنتظر قرارك" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-[14px] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-[#222]">آخر المشاريع</h2>
              <Link href="/dashboard/projects" className="text-[12px] font-bold text-[#2386c8] hover:text-[#1a6da8]">عرض الكل ←</Link>
            </div>

            {latestProjects.length === 0 ? (
              <p className="mt-5 rounded-[10px] border border-dashed border-gray-300 p-8 text-center text-[12px] text-[#888]">لم تنشر أي مشاريع بعد</p>
            ) : (
              <div className="mt-5 space-y-3">
                {latestProjects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`} className="flex items-center justify-between rounded-[10px] border border-gray-100 bg-white p-4 hover:border-[#2386c8]/20 hover:bg-[#2386c8]/[0.02]">
                    <div className="min-w-0">
                      <div className="line-clamp-1 text-[13px] font-bold text-[#222]">{project.title}</div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-[#888]">
                        <span dir="ltr">{formatBudgetRange(project.budgetMin, project.budgetMax)}</span>
                        <span>·</span>
                        <span>{formatDurationDays(project.durationDays)}</span>
                        <span>·</span>
                        <span>{formatDate(project.createdAt)}</span>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${PROJECT_STATUS_BADGE_CLASSES[project.status as keyof typeof PROJECT_STATUS_BADGE_CLASSES]}`}>
                      {PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS]}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <WishlistSection />
        </div>

        <div className="space-y-6">
          <section className="rounded-[14px] border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-[13px] font-bold text-[#222]">إجراءات سريعة</h2>
            <div className="mt-4 grid gap-2">
              <Link href="/projects/new" className="flex items-center gap-2 rounded-[10px] border border-gray-200 bg-white p-3 text-[12px] font-bold text-[#444] hover:border-[#2386c8] hover:text-[#2386c8]">
                <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#2386c8]/10 text-[#2386c8]">+</span>أضف مشروع جديد
              </Link>
              <Link href="/dashboard/proposals" className="flex items-center gap-2 rounded-[10px] border border-gray-200 bg-white p-3 text-[12px] font-bold text-[#444] hover:border-[#2386c8] hover:text-[#2386c8]">
                <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#2386c8]/10 text-[#2386c8]">↙</span>العروض المستلمة
              </Link>
              <Link href="/dashboard/messages" className="flex items-center gap-2 rounded-[10px] border border-gray-200 bg-white p-3 text-[12px] font-bold text-[#444] hover:border-[#2386c8] hover:text-[#2386c8]">
                <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#f4f5f7] text-[#666]">✉</span>الرسائل
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
