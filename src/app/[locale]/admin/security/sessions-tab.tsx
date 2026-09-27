'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';

import { terminateAllSessions, terminateSession } from '@/app/actions/admin';
import { DataTable } from '@/components/admin/data-table';

type SessionRow = {
  id: number;
  userId: number;
  userName: string | null;
  userEmail: string | null;
  ip: string | null;
  userAgent: string | null;
  lastActiveAt: Date | string;
  expiresAt: Date | string;
};

function formatDate(value: Date | string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ar');
}

export function SessionsTab({ sessions }: { sessions: SessionRow[] }) {
  const t = useTranslations('admin.security.sessions');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const runAction = (action: () => Promise<unknown>) => {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" id="sessions">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#1a1a2e]">{t('title')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('subtitle')}</p>
        </div>
        <button
          type="button"
          disabled={isPending || sessions.length === 0}
          onClick={() => runAction(() => terminateAllSessions())}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('terminateAll')}
        </button>
      </div>

      <DataTable columns={[t('user'), t('ip'), t('device'), t('lastActive'), t('expiresAt'), t('actions')]} empty={sessions.length === 0} emptyTitle={t('empty')}>
        {sessions.map((session) => (
          <tr key={session.id}>
            <td className="px-4 py-3">
              <div className="font-extrabold text-slate-900">{session.userName ?? `#${session.userId}`}</div>
              <div className="text-xs text-slate-500" dir="ltr">{session.userEmail ?? '—'}</div>
            </td>
            <td className="px-4 py-3" dir="ltr">{session.ip ?? '—'}</td>
            <td className="max-w-[260px] truncate px-4 py-3 text-xs text-slate-600" title={session.userAgent ?? undefined} dir="ltr">{session.userAgent ?? '—'}</td>
            <td className="px-4 py-3 whitespace-nowrap">{formatDate(session.lastActiveAt)}</td>
            <td className="px-4 py-3 whitespace-nowrap">{formatDate(session.expiresAt)}</td>
            <td className="px-4 py-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => runAction(() => terminateSession(session.id))}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-extrabold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
              >
                {t('terminate')}
              </button>
            </td>
          </tr>
        ))}
      </DataTable>
    </section>
  );
}
