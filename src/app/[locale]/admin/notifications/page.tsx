import { getAdminNotifications } from '@/app/actions/admin';
import { DataTable } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { SendNotificationModal } from './send-notification-modal';
export const dynamic='force-dynamic';
export default async function AdminNotificationsPage(){const rows=await getAdminNotifications();return <div className="space-y-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><Header title="الإشعارات" desc="الإشعارات المرسلة للمستخدمين."/><SendNotificationModal/></div><DataTable columns={['المستخدم','العنوان','الرسالة','النوع','القراءة','التاريخ']} empty={rows.length===0}>{rows.map(r=><tr key={r.id}><td className="px-4 py-3">{r.userName}</td><td className="px-4 py-3 font-bold">{r.title}</td><td className="px-4 py-3">{r.message}</td><td className="px-4 py-3">{r.type}</td><td className="px-4 py-3"><StatusBadge status={r.isRead?'approved':'pending'}>{r.isRead?'مقروء':'غير مقروء'}</StatusBadge></td><td className="px-4 py-3">{r.createdAt.toLocaleDateString('ar')}</td></tr>)}</DataTable></div>}
function Header({title,desc}:{title:string;desc:string}){return <div><h1 className="text-3xl font-extrabold text-[#1a1a2e]">{title}</h1><p className="mt-2 text-sm text-slate-500">{desc}</p></div>}
