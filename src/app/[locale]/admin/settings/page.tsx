import { getAdminSettings } from '@/app/actions/admin';
import { SettingsForm, type AdminSettingsValues } from './settings-form';
export const dynamic='force-dynamic';
export default async function AdminSettingsPage(){const rows=await getAdminSettings();const map=new Map(rows.map((r)=>[r.key,r.value]));const settings:AdminSettingsValues={siteName:map.get('siteName')??'خدمات',siteDescription:map.get('siteDescription')??'منصة خدمات للعمل الحر',commissionRate:map.get('commissionRate')??'15',minWithdrawal:map.get('minWithdrawal')??'10',maxWithdrawal:map.get('maxWithdrawal')??'1000',kycRequiredForFreelancers:(map.get('kycRequiredForFreelancers')??'true')==='true'};return <div className="space-y-6"><Header title="الإعدادات" desc="إعدادات المنصة العامة."/><SettingsForm settings={settings}/></div>}
function Header({title,desc}:{title:string;desc:string}){return <div><h1 className="text-3xl font-extrabold text-[#1a1a2e]">{title}</h1><p className="mt-2 text-sm text-slate-500">{desc}</p></div>}
