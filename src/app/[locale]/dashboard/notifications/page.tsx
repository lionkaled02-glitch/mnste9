import { redirect } from 'next/navigation';

import { markAllNotificationsAsReadAction } from '@/app/actions/notifications';
import { NotificationItem } from '@/components/notifications/notification-item';
import { getCurrentUser } from '@/lib/auth';
import { getNotifications } from '@/lib/services/notifications';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const items = await getNotifications(user.id, 50);

  return (
    <div className="mx-auto max-w-3xl p-6" dir="rtl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#222]">الإشعارات</h1>
        {items.length > 0 && <form action={markAllNotificationsAsReadAction}><button className="rounded-xl bg-[#2386c8] px-4 py-2 text-sm font-bold text-white">تحديد الكل كمقروء</button></form>}
      </div>
      {items.length === 0 ? <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center"><p className="text-gray-500">لا توجد إشعارات</p></div> : <div className="space-y-3">{items.map((item) => <NotificationItem key={item.id} notification={item} />)}</div>}
    </div>
  );
}
