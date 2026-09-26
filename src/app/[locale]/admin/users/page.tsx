import { Link } from '@/i18n/navigation';
import { getAdminUsers } from '@/app/actions/admin';
import { DataTable } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const rows = await getAdminUsers({ role: String(params.role ?? ''), kyc: String(params.kyc ?? ''), q: String(params.q ?? '') });
  return (
    <div className="space-y-6">
      <Header title="Users" desc="إدارة المستخدمين والأدوار وحالة KYC." />
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form className="grid gap-3 md:grid-cols-4">
          <input name="q" placeholder="بحث بالاسم أو البريد" className="rounded-xl border border-slate-200 px-4 py-2 text-sm" />
          <select name="role" className="rounded-xl border border-slate-200 px-4 py-2 text-sm"><option value="">كل الأدوار</option><option value="client">Client</option><option value="freelancer">Freelancer</option><option value="admin">Admin</option></select>
          <select name="kyc" className="rounded-xl border border-slate-200 px-4 py-2 text-sm"><option value="">كل حالات KYC</option><option value="verified">Verified</option><option value="unverified">Unverified</option></select>
          <button className="rounded-xl bg-[#1a1a2e] px-4 py-2 text-sm font-bold text-white">تصفية</button>
        </form>
        <div className="mt-3 flex gap-2"><button className="rounded-lg border px-3 py-1.5 text-xs font-bold">تصدير CSV</button><button className="rounded-lg border px-3 py-1.5 text-xs font-bold">إرسال إشعار</button></div>
      </div>
      <DataTable columns={['المستخدم', 'البريد', 'الدور', 'KYC', 'الرصيد', 'التسجيل', 'آخر تحديث', 'الإجراءات']} empty={rows.length === 0}>
        {rows.map((row) => <tr key={row.id}><td className="px-4 py-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1a2e] font-bold text-white">{row.name.slice(0,1)}</div><b>{row.name}</b></div></td><td className="px-4 py-3" dir="ltr">{row.email}</td><td className="px-4 py-3"><StatusBadge status={row.role}>{row.role}</StatusBadge></td><td className="px-4 py-3"><StatusBadge status={row.isKycVerified ? 'approved' : 'pending'}>{row.isKycVerified ? 'Verified' : 'Not verified'}</StatusBadge></td><td className="px-4 py-3">{row.balance ?? '0.00'}</td><td className="px-4 py-3">{row.createdAt.toLocaleDateString('ar')}</td><td className="px-4 py-3">{row.updatedAt.toLocaleDateString('ar')}</td><td className="px-4 py-3"><Link href={`/admin/users/${row.id}`} className="font-bold text-[#2386c8]">تفاصيل</Link></td></tr>)}
      </DataTable>
    </div>
  );
}
function Header({ title, desc }: { title: string; desc: string }) { return <div><h1 className="text-3xl font-extrabold text-[#1a1a2e]">{title}</h1><p className="mt-2 text-sm text-slate-500">{desc}</p></div>; }
