import { Link } from '@/i18n/navigation';

import type { SafeUser } from '@/lib/auth';
import { getUnreadCount } from '@/lib/services/notifications';

export async function AdminHeader({ user }: { user: SafeUser }) {
  const initial = user.name.trim().slice(0, 1) || 'م';
  const unreadCount = await getUnreadCount(user.id);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1a1a2e] text-lg font-extrabold text-white">خ</div>
          <div>
            <p className="text-base font-extrabold text-[#1a1a2e]">خدمات</p>
            <p className="text-xs font-bold text-slate-500">لوحة الإدارة</p>
          </div>
          <span className="hidden rounded-full bg-[#1a1a2e]/10 px-3 py-1 text-xs font-extrabold text-[#1a1a2e] sm:inline-flex">مشرف</span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/notifications" className="relative rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm hover:text-[#1a1a2e]" aria-label="الإشعارات">
            🔔
            {unreadCount > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </Link>
          <Link href="/dashboard" className="hidden rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:border-[#1a1a2e] hover:text-[#1a1a2e] sm:inline-flex">العودة إلى المنصة</Link>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a1a2e] text-sm font-extrabold text-white">{initial}</div>
            <div className="hidden text-right md:block">
              <p className="text-xs font-extrabold text-slate-900">{user.name}</p>
              <p className="text-[11px] text-slate-500">{user.email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
