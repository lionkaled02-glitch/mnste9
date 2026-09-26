import { getAdminProposals } from '@/app/actions/admin';
import { DataTable } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';

type Props={searchParams?:Promise<Record<string,string|string[]|undefined>>}; export const dynamic='force-dynamic';
export default async function AdminProposalsPage({searchParams}:Props){const p=(await searchParams)??{};const rows=await getAdminProposals(String(p.status??''));return <div className="space-y-6"><Header title="Proposals" desc="متابعة عروض المستقلين."/><DataTable columns={['المشروع','المستقل','المبلغ','المدة','الحالة','التقديم']} empty={rows.length===0}>{rows.map(r=><tr key={r.id}><td className="px-4 py-3 font-bold">{r.projectTitle}</td><td className="px-4 py-3">{r.freelancerName}</td><td className="px-4 py-3">{r.amount}</td><td className="px-4 py-3">{r.durationDays} يوم</td><td className="px-4 py-3"><StatusBadge status={r.status}>{r.status}</StatusBadge></td><td className="px-4 py-3">{r.createdAt.toLocaleDateString('ar')}</td></tr>)}</DataTable></div>}
function Header({title,desc}:{title:string;desc:string}){return <div><h1 className="text-3xl font-extrabold text-[#1a1a2e]">{title}</h1><p className="mt-2 text-sm text-slate-500">{desc}</p></div>}
