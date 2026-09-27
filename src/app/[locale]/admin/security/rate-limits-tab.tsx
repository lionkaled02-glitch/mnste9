'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';

import { unblockRateLimit } from '@/app/actions/admin';
import { DataTable } from '@/components/admin/data-table';

type RateLimitRow = {
  id: number;
  key: string;
  attempts: number;
  windowStart: Date | string;
  blockedUntil: Date | string | null;
};

function formatDate(value: Date | string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ar');
}

export function RateLimitsTab({ limits }: { limits: RateLimitRow[] }) {
  const t = useTranslations('admin.security.rateLimits');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const unblock = (key: string) => {
    startTransition(async () => {
      await unblockRateLimit(key);
      router.refresh();
    });
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" id="rate-limits">
      <div className="mb-4">
        <h2 className="text-xl font-extrabold text-[#1a1a2e]">{t('title')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('subtitle')}</p>
      </div>

      <DataTable columns={[t('key'), t('attempts'), t('blockedUntil'), t('actions')]} empty={limits.length === 0} emptyTitle={t('empty')}>
        {limits.map((limit) => (
          <tr key={limit.id}>
            <td className="px-4 py-3 font-bold" dir="ltr">{limit.key}</td>
            <td className="px-4 py-3">{limit.attempts}</td>
            <td className="px-4 py-3 whitespace-nowrap">{formatDate(limit.blockedUntil)}</td>
            <td className="px-4 py-3">
              <button type="button" disabled={isPending} onClick={() => unblock(limit.key)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-extrabold text-slate-700 hover:border-[#1a1a2e] disabled:opacity-50">{t('unblock')}</button>
            </td>
          </tr>
        ))}
      </DataTable>
    </section>
  );
}
