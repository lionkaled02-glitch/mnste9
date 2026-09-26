import { getAdminWithdrawals } from '@/app/actions/admin';
import { DataTable } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';

type Props={searchParams?:Promise<Record<string,string|string[]|undefined>>}; export const dynamic='force-dynamic';
export default async function AdminWithdrawalsPage({searchParams}:Props){const p=(await searchParams)??{};const rows=await getAdminWithdrawals(String(p.status??'pending'));return <div className="space-y-6"><Header title="Withdrawals" desc="مراجعة طلبات السحب المعلقة والمنجزة."/><DataTable columns={['المستخدم','المبلغ','طريقة الدفع','الحالة','المرجع','التاريخ']} empty={rows.length===0}>{rows.map(r=><tr key={r.id}><td className="px-4 py-3 font-bold">{r.userName}</td><td className="px-4 py-3">{r.amount}</td><td className="px-4 py-3">{r.paymentMethod??'—'}</td><td className="px-4 py-3"><StatusBadge status={r.status}>{r.status}</StatusBadge></td><td className="px-4 py-3">{r.referenceId??'—'}</td><td className="px-4 py-3">{r.createdAt.toLocaleDateString('ar')}</td></tr>)}</DataTable></div>}
function Header({title,desc}:{title:string;desc:string}){return <div><h1 className="text-3xl font-extrabold text-[#1a1a2e]">{title}</h1><p className="mt-2 text-sm text-slate-500">{desc}</p></div>}
