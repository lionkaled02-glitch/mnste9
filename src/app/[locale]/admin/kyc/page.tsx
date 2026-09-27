import { Link } from '@/i18n/navigation';
import { getAdminKyc } from '@/app/actions/admin';
import { DataTable } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { QuickApproveButton } from './quick-approve-button';

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };
export const dynamic = 'force-dynamic';

export default async function AdminKycPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const status = String(params.status ?? 'pending');
  const rows = await getAdminKyc(status);
  return <div className="space-y-6"><Header title="توثيق الهوية" desc="مراجعة وثائق توثيق الهوية."/><Tabs active={status}/><DataTable columns={['المستخدم','نوع الوثيقة','رقم الوثيقة','تاريخ الإرسال','الحالة','الإجراءات']} empty={rows.length===0}>{rows.map(doc=><tr key={doc.id}><td className="px-4 py-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1a2e] font-bold text-white">{doc.userName?.slice(0,1) ?? '؟'}</div><div><b>{doc.userName}</b><p className="text-xs text-slate-500" dir="ltr">{doc.userEmail}</p></div></div></td><td className="px-4 py-3">{doc.documentType}</td><td className="px-4 py-3">{doc.documentNumber ?? '—'}</td><td className="px-4 py-3">{doc.createdAt.toLocaleDateString('ar')}</td><td className="px-4 py-3"><StatusBadge status={doc.status}>{doc.status}</StatusBadge></td><td className="px-4 py-3"><div className="flex flex-wrap items-center gap-2"><Link href={`/admin/kyc/${doc.id}`} className="rounded-lg bg-[#2386c8]/10 px-3 py-1.5 text-xs font-bold text-[#2386c8]">مراجعة</Link>{doc.status==='pending'&&<QuickApproveButton kycId={doc.id}/>}</div></td></tr>)}</DataTable></div>
}
function Header({title,desc}:{title:string;desc:string}){return <div><h1 className="text-3xl font-extrabold text-[#1a1a2e]">{title}</h1><p className="mt-2 text-sm text-slate-500">{desc}</p></div>}
function Tabs({active}:{active:string}){return <div className="flex gap-2"><Link href="/admin/kyc?status=pending" className={`rounded-xl px-4 py-2 text-sm font-bold ${active==='pending'?'bg-[#1a1a2e] text-white':'bg-white border'}`}>قيد الانتظار</Link><Link href="/admin/kyc?status=approved" className={`rounded-xl px-4 py-2 text-sm font-bold ${active==='approved'?'bg-[#1a1a2e] text-white':'bg-white border'}`}>مقبول</Link><Link href="/admin/kyc?status=rejected" className={`rounded-xl px-4 py-2 text-sm font-bold ${active==='rejected'?'bg-[#1a1a2e] text-white':'bg-white border'}`}>مرفوض</Link></div>}
