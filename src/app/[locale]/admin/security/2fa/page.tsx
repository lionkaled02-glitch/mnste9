import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { users } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { StatusBadge } from '@/components/admin/status-badge';

import { Disable2FAButton } from './disable-2fa-button';
import { Enable2FAForm } from './enable-2fa-form';

export const metadata: Metadata = { title: 'التحقق الثنائي | لوحة الإدارة | خدمات' };
export const dynamic = 'force-dynamic';

export default async function AdminTwoFactorPage() {
  const t = await getTranslations('admin.twoFactor');
  const currentUser = await getCurrentUser();
  const [row] = currentUser ? await db.select({ twoFactorEnabled: users.twoFactorEnabled }).from(users).where(eq(users.id, currentUser.id)).limit(1) : [];
  const enabled = Boolean(row?.twoFactorEnabled);
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[#1a1a2e] p-6 text-white"><h1 className="text-3xl font-extrabold">{t('title')}</h1><p className="mt-2 text-sm text-slate-300">{t('subtitle')}</p></div>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-slate-500">{t('status')}</p><div className="mt-2"><StatusBadge status={enabled ? 'active' : 'pending'}>{enabled ? t('enabled') : t('disabled')}</StatusBadge></div></div>{enabled ? <Disable2FAButton /> : <Enable2FAForm />}</div>
      </section>
    </div>
  );
}
