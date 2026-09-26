import { getAdminProjects } from '@/app/actions/admin';
import { DataTable } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { ConfirmModal } from '@/components/admin/confirm-modal';

type Props={searchParams?:Promise<Record<string,string|string[]|undefined>>}; export const dynamic='force-dynamic';
export default async function AdminProjectsPage({searchParams}:Props){const p=(await searchParams)??{};const rows=await getAdminProjects(String(p.status??''));return <div className="space-y-6"><Header title="Projects" desc="إدارة المشاريع والمنشورات."/><DataTable columns={['العنوان','صاحب المشروع','الميزانية','الحالة','العروض','النشر','الإجراءات']} empty={rows.length===0}>{rows.map(r=><tr key={r.id}><td className="px-4 py-3 font-bold">{r.title}</td><td className="px-4 py-3">{r.clientName}</td><td className="px-4 py-3">{r.budgetMin} - {r.budgetMax}</td><td className="px-4 py-3"><StatusBadge status={r.status}>{r.status}</StatusBadge></td><td className="px-4 py-3">{r.proposalsCount}</td><td className="px-4 py-3">{r.createdAt.toLocaleDateString('ar')}</td><td className="px-4 py-3"><div className="flex gap-2"><button className="rounded-lg border px-3 py-1.5 text-xs font-bold">تعطيل</button><ConfirmModal title="حذف المشروع" description="سيتم حذف المشروع بعد التأكيد." confirmLabel="حذف"/></div></td></tr>)}</DataTable></div>}
function Header({title,desc}:{title:string;desc:string}){return <div><h1 className="text-3xl font-extrabold text-[#1a1a2e]">{title}</h1><p className="mt-2 text-sm text-slate-500">{desc}</p></div>}
