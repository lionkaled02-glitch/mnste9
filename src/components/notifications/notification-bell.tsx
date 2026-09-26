'use client';

import { useEffect, useState } from 'react';

import { NotificationList } from './notification-list';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/notifications/unread-count', { cache: 'no-store' });
        const data = (await res.json()) as { count?: number };
        setUnreadCount(data.count ?? 0);
      } catch {}
    };
    void fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative rounded-full p-2 hover:bg-gray-100" aria-label="الإشعارات" type="button">
        <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a3 3 0 1 1-5.714 0" /></svg>
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
      {open && <><div className="fixed inset-0 z-40" onClick={() => setOpen(false)} /><div className="absolute left-0 top-12 z-50 w-96 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white shadow-xl"><NotificationList onClose={() => setOpen(false)} /></div></>}
    </div>
  );
}
