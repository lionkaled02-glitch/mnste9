import { Link } from '@/i18n/navigation';
import { getAdminDashboard } from '@/app/actions/admin';
import { StatCard } from '@/components/admin/stat-card';
import { StatusBadge } from '@/components/admin/status-badge';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const { stats, chart, activities } = await getAdminDashboard();
  const maxUsers = Math.max(...chart.map((p) => p.users));
  const maxRevenue = Math.max(...chart.map((p) => p.revenue));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1a1a2e]">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">نظرة تنفيذية على أداء منصة خدمات.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/kyc" className="rounded-xl bg-[#1a1a2e] px-4 py-2 text-sm font-bold text-white">مراجعة KYC <StatusBadge status="rejected" className="ms-2">{stats.pendingKyc}</StatusBadge></Link>
          <Link href="/admin/withdrawals" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">طلبات السحب {stats.pendingWithdrawals}</Link>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="المستخدمون" value={stats.usersTotal} subtitle={`+${stats.usersWeek} هذا الأسبوع`} icon="👥" />
        <StatCard title="المشاريع" value={stats.projectsTotal} subtitle={`${stats.projectsOpen} مفتوحة`} icon="📋" tone="blue" />
        <StatCard title="العروض" value={stats.proposalsTotal} subtitle={`${stats.proposalsPending} قيد الانتظار`} icon="🎯" tone="amber" />
        <StatCard title="العقود" value={stats.activeContracts} subtitle={`${stats.completedContracts} مكتملة`} icon="📝" tone="emerald" />
        <StatCard title="الإيرادات" value={`$${stats.revenue.toFixed(2)}`} subtitle={`$${stats.monthlyRevenue.toFixed(2)} هذا الشهر`} icon="💵" tone="emerald" />
        <StatCard title="Escrow" value={`$${stats.escrow.toFixed(2)}`} subtitle="المحتجز حالياً" icon="🔒" tone="violet" />
        <StatCard title="KYC" value={stats.pendingKyc} subtitle="طلبات بانتظار المراجعة" icon="🆔" tone="red" />
        <StatCard title="السحب" value={stats.pendingWithdrawals} subtitle="طلبات معلقة" icon="💸" tone="red" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-[#1a1a2e]">المستخدمون الجدد — آخر 30 يوم</h2>
          <div className="mt-6 flex h-48 items-end gap-1">
            {chart.map((point) => <div key={point.day} className="flex-1 rounded-t bg-[#2386c8]" style={{ height: `${(point.users / maxUsers) * 100}%` }} title={`${point.users}`} />)}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-[#1a1a2e]">الإيرادات — آخر 30 يوم</h2>
          <div className="mt-6 flex h-48 items-end gap-1">
            {chart.map((point) => <div key={point.day} className="flex-1 rounded-t bg-[#1a1a2e]" style={{ height: `${(point.revenue / maxRevenue) * 100}%` }} title={`$${point.revenue}`} />)}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-[#1a1a2e]">آخر الأنشطة</h2>
          <div className="mt-4 space-y-3">
            {activities.map((activity) => <div key={activity.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="font-bold text-slate-700">{activity.title}</span><time className="text-xs text-slate-400">{activity.createdAt.toLocaleDateString('ar')}</time></div>)}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-[#1a1a2e]">روابط سريعة</h2>
          <div className="mt-4 grid gap-3">
            <Link href="/admin/kyc" className="rounded-xl bg-red-50 px-4 py-3 font-bold text-red-700">مراجعة KYC — {stats.pendingKyc}</Link>
            <Link href="/admin/withdrawals" className="rounded-xl bg-amber-50 px-4 py-3 font-bold text-amber-700">طلبات السحب — {stats.pendingWithdrawals}</Link>
            <Link href="/admin/contracts?status=disputed" className="rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-800">النزاعات النشطة — {stats.disputedContracts}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
