'use client';

import { useEffect, useState } from 'react';

import { Link } from '@/i18n/navigation';
import type { NotificationDTO } from '@/lib/services/notifications';

import { NotificationItem } from './notification-item';

export function NotificationList({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<NotificationDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const response = await fetch('/api/notifications', { cache: 'no-store' });
    const data = (await response.json()) as { items?: NotificationDTO[] };
    setItems(data.items ?? []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const markAll = async () => {
    await fetch('/api/notifications/mark-read', { method: 'POST', body: JSON.stringify({ all: true }) });
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  const markOne = async (id: number) => {
    await fetch('/api/notifications/mark-read', { method: 'POST', body: JSON.stringify({ id }) });
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
    onClose();
  };

  return (
    <div className="overflow-hidden rounded-xl bg-white" dir="rtl">
      <div className="flex items-center justify-between border-b border-slate-100 p-4">
        <h2 className="font-extrabold text-slate-900">الإشعارات</h2>
        <button type="button" onClick={markAll} className="text-xs font-bold text-[#2386c8]">تحديد الكل كمقروء</button>
      </div>
      <div className="max-h-96 overflow-y-auto p-3">
        {loading ? <p className="p-4 text-center text-sm text-slate-500">جارٍ التحميل…</p> : null}
        {!loading && items.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">لا توجد إشعارات</p> : null}
        <div className="space-y-2">
          {items.map((item) => <NotificationItem key={item.id} notification={item} onRead={() => markOne(item.id)} />)}
        </div>
      </div>
      <Link href="/dashboard/notifications" onClick={onClose} className="block border-t border-slate-100 p-3 text-center text-sm font-bold text-[#2386c8]">عرض كل الإشعارات</Link>
    </div>
  );
}
