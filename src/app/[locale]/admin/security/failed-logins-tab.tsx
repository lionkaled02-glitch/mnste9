'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

import { blockIp, unblockIp } from '@/app/actions/admin';
import { DataTable } from '@/components/admin/data-table';

type FailedLoginRow = {
  id: number;
  email: string;
  ip: string;
  userAgent?: string | null;
  reason: string;
  createdAt: Date | string;
};

function formatDate(value: Date | string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ar');
}

export function FailedLoginsTab({ attempts }: { attempts: FailedLoginRow[] }) {
  const t = useTranslations('admin.security.failedLogins');
  const router = useRouter();
  const [hours, setHours] = useState(24);
  const [isPending, startTransition] = useTransition();

  const visibleAttempts = useMemo(() => {
    const since = Date.now() - hours * 60 * 60 * 1000;
    return attempts.filter((attempt) => new Date(attempt.createdAt).getTime() >= since);
  }, [attempts, hours]);

  const runAction = (action: () => Promise<unknown>) => {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" id="failed-logins">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#1a1a2e]">{t('title')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('subtitle')}</p>
        </div>
        <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button type="button" onClick={() => setHours(24)} className={`rounded-lg px-3 py-1.5 text-xs font-extrabold ${hours === 24 ? 'bg-[#1a1a2e] text-white' : 'text-slate-600'}`}>{t('filter24h')}</button>
          <button type="button" onClick={() => setHours(24 * 7)} className={`rounded-lg px-3 py-1.5 text-xs font-extrabold ${hours === 24 * 7 ? 'bg-[#1a1a2e] text-white' : 'text-slate-600'}`}>{t('filter7d')}</button>
        </div>
      </div>

      <DataTable columns={[t('email'), t('ip'), t('reason'), t('date'), t('actions')]} empty={visibleAttempts.length === 0} emptyTitle={t('empty')}>
        {visibleAttempts.map((attempt) => (
          <tr key={attempt.id}>
            <td className="px-4 py-3 font-bold" dir="ltr">{attempt.email}</td>
            <td className="px-4 py-3" dir="ltr">{attempt.ip}</td>
            <td className="px-4 py-3">{attempt.reason}</td>
            <td className="px-4 py-3 whitespace-nowrap">{formatDate(attempt.createdAt)}</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={isPending} onClick={() => runAction(() => blockIp(attempt.ip))} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-red-700 disabled:opacity-50">{t('block')}</button>
                <button type="button" disabled={isPending} onClick={() => runAction(() => unblockIp(attempt.ip))} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-extrabold text-slate-700 hover:border-[#1a1a2e] disabled:opacity-50">{t('unblock')}</button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </section>
  );
}
