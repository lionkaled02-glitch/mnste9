'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Link } from '@/i18n/navigation';
import type { NotificationDTO } from '@/lib/services/notifications';

import { NotificationItem } from './notification-item';

interface NotificationListProps {
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
  onRefreshCount?: () => Promise<void> | void;
}

export function NotificationList({ onClose, onUnreadCountChange, onRefreshCount }: NotificationListProps) {
  const [items, setItems] = useState<NotificationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = useMemo(() => items.filter((item) => !item.isRead).length, [items]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications', {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      const data = (await response.json()) as { items?: NotificationDTO[] };
      const nextItems = data.items ?? [];
      setItems(nextItems);
      onUnreadCountChange?.(nextItems.filter((item) => !item.isRead).length);
    } finally {
      setLoading(false);
    }
  }, [onUnreadCountChange]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const markAll = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ all: true }),
      });
      if (!response.ok) return;
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      onUnreadCountChange?.(0);
      await onRefreshCount?.();
    } finally {
      setMarkingAll(false);
    }
  };

  const markOne = async (id: number) => {
    const current = items.find((item) => item.id === id);
    if (!current?.isRead) {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
      onUnreadCountChange?.(Math.max(0, unreadCount - 1));
    }

    const response = await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ id }),
    });

    if (!response.ok && current) {
      setItems((prev) => prev.map((item) => (item.id === id ? current : item)));
      onUnreadCountChange?.(unreadCount);
      return;
    }

    await onRefreshCount?.();
    onClose();
  };

  return (
    <div className="overflow-hidden rounded-xl bg-white" dir="rtl">
      <div className="flex items-center justify-between border-b border-slate-100 p-4">
        <h2 className="font-extrabold text-slate-900">الإشعارات</h2>
        <button
          type="button"
          onClick={markAll}
          disabled={markingAll || unreadCount === 0}
          className="text-xs font-bold text-[#2386c8] disabled:cursor-not-allowed disabled:text-slate-300"
        >
          {markingAll ? 'جارٍ التحديث...' : 'تحديد الكل كمقروء'}
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto p-3">
        {loading ? <p className="p-4 text-center text-sm text-slate-500">جارٍ التحميل…</p> : null}
        {!loading && items.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">لا توجد إشعارات</p> : null}
        <div className="space-y-2">
          {items.map((item) => (
            <NotificationItem key={item.id} notification={item} onRead={() => markOne(item.id)} />
          ))}
        </div>
      </div>
      <Link href="/dashboard/notifications" onClick={onClose} className="block border-t border-slate-100 p-3 text-center text-sm font-bold text-[#2386c8]">
        عرض كل الإشعارات
      </Link>
    </div>
  );
}
