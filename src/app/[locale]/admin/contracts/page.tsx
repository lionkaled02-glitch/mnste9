import { Link } from '@/i18n/navigation';
import { getAdminContracts } from '@/app/actions/admin';
import { DataTable } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';

type Props={searchParams?:Promise<Record<string,string|string[]|undefined>>}; export const dynamic='force-dynamic';
export default async function AdminContractsPage({searchParams}:Props){const p=(await searchParams)??{};const rows=await getAdminContracts(String(p.status??''));return <div className="space-y-6"><Header title="Contracts" desc="متابعة العقود والنزاعات."/><DataTable columns={['المشروع','العميل','المستقل','المبلغ','الحالة','نزاع','الإجراءات']} empty={rows.length===0}>{rows.map(r=><tr key={r.id}><td className="px-4 py-3 font-bold">{r.projectTitle}</td><td className="px-4 py-3">{r.clientName}</td><td className="px-4 py-3">{r.freelancerName}</td><td className="px-4 py-3">{r.amount}</td><td className="px-4 py-3"><StatusBadge status={r.status}>{r.status}</StatusBadge></td><td className="px-4 py-3">{r.status==='disputed'?<StatusBadge status="disputed">متنازع عليها</StatusBadge>:'—'}</td><td className="px-4 py-3"><Link href={`/admin/contracts/${r.id}`} className="font-bold text-[#2386c8]">تفاصيل</Link></td></tr>)}</DataTable></div>}
function Header({title,desc}:{title:string;desc:string}){return <div><h1 className="text-3xl font-extrabold text-[#1a1a2e]">{title}</h1><p className="mt-2 text-sm text-slate-500">{desc}</p></div>}
