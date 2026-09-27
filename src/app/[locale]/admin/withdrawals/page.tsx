import { getAdminWithdrawals } from '@/app/actions/admin';
import { DataTable } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { ApproveWithdrawalButton } from './approve-withdrawal-button';
import { RejectWithdrawalButton } from './reject-withdrawal-button';

type Props={searchParams?:Promise<Record<string,string|string[]|undefined>>}; export const dynamic='force-dynamic';
export default async function AdminWithdrawalsPage({searchParams}:Props){const p=(await searchParams)??{};const rows=await getAdminWithdrawals(String(p.status??'pending'));return <div className="space-y-6"><Header title="السحوبات" desc="مراجعة طلبات السحب المعلقة والمنجزة."/><DataTable columns={['المستخدم','المبلغ','طريقة الدفع','الحالة','المرجع','التاريخ','الإجراءات']} empty={rows.length===0}>{rows.map(w=><tr key={w.id}><td className="px-4 py-3 font-bold">{w.userName}</td><td className="px-4 py-3">{w.amount}</td><td className="px-4 py-3">{w.paymentMethod??'—'}</td><td className="px-4 py-3"><StatusBadge status={w.status}>{w.status}</StatusBadge></td><td className="px-4 py-3">{w.referenceId??'—'}</td><td className="px-4 py-3">{w.createdAt.toLocaleDateString('ar')}</td><td className="px-4 py-3"><div className="flex items-center gap-2">{w.status==='pending'?<><ApproveWithdrawalButton withdrawalId={w.id}/><RejectWithdrawalButton withdrawalId={w.id}/></>:'—'}</div></td></tr>)}</DataTable></div>}
function Header({title,desc}:{title:string;desc:string}){return <div><h1 className="text-3xl font-extrabold text-[#1a1a2e]">{title}</h1><p className="mt-2 text-sm text-slate-500">{desc}</p></div>}
