import { Link } from '@/i18n/navigation';
import { getAdminKyc } from '@/app/actions/admin';
import { DataTable } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };
export const dynamic = 'force-dynamic';

export default async function AdminKycPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const status = String(params.status ?? 'pending');
  const rows = await getAdminKyc(status);
  return <div className="space-y-6"><Header title="KYC" desc="مراجعة وثائق توثيق الهوية."/><Tabs active={status}/><DataTable columns={['المستخدم','نوع الوثيقة','رقم الوثيقة','تاريخ الإرسال','الحالة','الإجراءات']} empty={rows.length===0}>{rows.map(row=><tr key={row.id}><td className="px-4 py-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1a2e] font-bold text-white">{row.userName?.slice(0,1) ?? '؟'}</div><div><b>{row.userName}</b><p className="text-xs text-slate-500" dir="ltr">{row.userEmail}</p></div></div></td><td className="px-4 py-3">{row.documentType}</td><td className="px-4 py-3">{row.documentNumber ?? '—'}</td><td className="px-4 py-3">{row.createdAt.toLocaleDateString('ar')}</td><td className="px-4 py-3"><StatusBadge status={row.status}>{row.status}</StatusBadge></td><td className="px-4 py-3"><Link href={`/admin/kyc/${row.id}`} className="font-bold text-[#2386c8]">مراجعة</Link></td></tr>)}</DataTable></div>
}
function Header({title,desc}:{title:string;desc:string}){return <div><h1 className="text-3xl font-extrabold text-[#1a1a2e]">{title}</h1><p className="mt-2 text-sm text-slate-500">{desc}</p></div>}
function Tabs({active}:{active:string}){return <div className="flex gap-2"><Link href="/admin/kyc?status=pending" className={`rounded-xl px-4 py-2 text-sm font-bold ${active==='pending'?'bg-[#1a1a2e] text-white':'bg-white border'}`}>Pending</Link><Link href="/admin/kyc?status=approved" className={`rounded-xl px-4 py-2 text-sm font-bold ${active==='approved'?'bg-[#1a1a2e] text-white':'bg-white border'}`}>Approved</Link><Link href="/admin/kyc?status=rejected" className={`rounded-xl px-4 py-2 text-sm font-bold ${active==='rejected'?'bg-[#1a1a2e] text-white':'bg-white border'}`}>Rejected</Link></div>}
