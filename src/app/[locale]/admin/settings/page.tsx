import { getAdminSettings } from '@/app/actions/admin';
import { DataTable } from '@/components/admin/data-table';
export const dynamic='force-dynamic';
export default async function AdminSettingsPage(){const rows=await getAdminSettings();return <div className="space-y-6"><Header title="Settings" desc="إعدادات المنصة العامة."/><DataTable columns={['المفتاح','القيمة','الوصف','آخر تحديث']} empty={rows.length===0}>{rows.map(r=><tr key={r.id}><td className="px-4 py-3 font-bold">{r.key}</td><td className="px-4 py-3">{r.value}</td><td className="px-4 py-3">{r.description??'—'}</td><td className="px-4 py-3">{r.updatedAt.toLocaleDateString('ar')}</td></tr>)}</DataTable></div>}
function Header({title,desc}:{title:string;desc:string}){return <div><h1 className="text-3xl font-extrabold text-[#1a1a2e]">{title}</h1><p className="mt-2 text-sm text-slate-500">{desc}</p></div>}
