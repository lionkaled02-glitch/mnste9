'use client';

import { Link } from '@/i18n/navigation';
import type { NotificationDTO } from '@/lib/services/notifications';

const tone = {
  info: 'bg-[#2386c8]/10 text-[#2386c8]',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-700',
} as const;

export function NotificationItem({ notification, onRead }: { notification: NotificationDTO; onRead?: () => void }) {
  const content = (
    <article className={`rounded-xl border p-4 transition hover:border-[#2386c8]/40 ${notification.isRead ? 'border-slate-200 bg-white' : 'border-[#2386c8]/20 bg-[#2386c8]/5'}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.isRead ? 'bg-slate-300' : 'bg-[#2386c8]'}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-extrabold text-slate-900">{notification.title}</h3>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${tone[(notification.type as keyof typeof tone) ?? 'info'] ?? tone.info}`}>{notification.type}</span>
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-600">{notification.message}</p>
          <time className="mt-2 block text-xs text-slate-400">{new Date(notification.createdAt).toLocaleString('ar')}</time>
        </div>
      </div>
    </article>
  );

  if (!notification.link) return <button type="button" onClick={onRead} className="block w-full text-right">{content}</button>;
  return <Link href={notification.link} onClick={onRead} className="block">{content}</Link>;
}
