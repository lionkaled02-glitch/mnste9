import { notFound } from 'next/navigation';
import { getAdminUserDetails } from '@/app/actions/admin';
import { DataTable } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';

type Props = { params: Promise<{ id: string }> };
export const dynamic = 'force-dynamic';

export default async function AdminUserDetailsPage({ params }: Props) {
  const { id } = await params;
  const data = await getAdminUserDetails(Number(id));
  if (!data) notFound();
  const { user } = data;
  return <div className="space-y-6"><div className="rounded-2xl bg-[#1a1a2e] p-6 text-white"><h1 className="text-3xl font-extrabold">{user.name}</h1><p dir="ltr" className="mt-2 text-slate-300">{user.email}</p><div className="mt-4 flex gap-2"><StatusBadge status={user.role}>{user.role}</StatusBadge><StatusBadge status={user.isKycVerified ? 'approved':'pending'}>{user.isKycVerified ? 'KYC Verified':'KYC Pending'}</StatusBadge></div></div><section className="grid gap-4 md:grid-cols-3"><Action label="تعديل الدور"/><Action label="تعطيل/تفعيل"/><Action label="إعادة تعيين كلمة المرور"/></section><Block title="المشاريع"><DataTable columns={['العنوان','الحالة','التاريخ']} empty={data.projects.length===0}>{data.projects.map(p=><tr key={p.id}><td className="px-4 py-3">{p.title}</td><td className="px-4 py-3"><StatusBadge status={p.status}>{p.status}</StatusBadge></td><td className="px-4 py-3">{p.createdAt.toLocaleDateString('ar')}</td></tr>)}</DataTable></Block><Block title="العقود"><DataTable columns={['#','المبلغ','الحالة','التاريخ']} empty={data.contracts.length===0}>{data.contracts.map(c=><tr key={c.id}><td className="px-4 py-3">#{c.id}</td><td className="px-4 py-3">{c.amount}</td><td className="px-4 py-3"><StatusBadge status={c.status}>{c.status}</StatusBadge></td><td className="px-4 py-3">{c.createdAt.toLocaleDateString('ar')}</td></tr>)}</DataTable></Block><Block title="المعاملات"><DataTable columns={['#','النوع','المبلغ','الحالة']} empty={data.transactions.length===0}>{data.transactions.map(t=><tr key={t.id}><td className="px-4 py-3">#{t.id}</td><td className="px-4 py-3">{t.type}</td><td className="px-4 py-3">{t.amount}</td><td className="px-4 py-3"><StatusBadge status={t.status}>{t.status}</StatusBadge></td></tr>)}</DataTable></Block><Block title="التقييمات"><DataTable columns={['#','التقييم','التعليق','التاريخ']} empty={data.reviews.length===0}>{data.reviews.map(r=><tr key={r.id}><td className="px-4 py-3">#{r.id}</td><td className="px-4 py-3">{'★'.repeat(r.rating)}</td><td className="px-4 py-3">{r.comment ?? '—'}</td><td className="px-4 py-3">{r.createdAt.toLocaleDateString('ar')}</td></tr>)}</DataTable></Block></div>;
}
function Action({label}:{label:string}){return <button className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-extrabold text-[#1a1a2e] shadow-sm">{label}</button>}
function Block({title,children}:{title:string;children:React.ReactNode}){return <section className="space-y-3"><h2 className="text-xl font-extrabold text-[#1a1a2e]">{title}</h2>{children}</section>}
