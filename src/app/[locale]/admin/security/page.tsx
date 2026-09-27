import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { getAdminSecurity } from '@/app/actions/admin';
import { StatCard } from '@/components/admin/stat-card';

import { AuditLogTab } from './audit-log-tab';
import { FailedLoginsTab } from './failed-logins-tab';
import { RateLimitsTab } from './rate-limits-tab';
import { SessionsTab } from './sessions-tab';

export const metadata: Metadata = {
  title: 'الحماية | لوحة الإدارة | خدمات',
};

export const dynamic = 'force-dynamic';

export default async function AdminSecurityPage() {
  const t = await getTranslations('admin.security');
  const security = await getAdminSecurity();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[#1a1a2e] p-6 text-white shadow-sm">
        <p className="text-sm font-bold text-[#2386c8]">{t('eyebrow')}</p>
        <h1 className="mt-2 text-3xl font-extrabold">{t('title')}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">{t('subtitle')}</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title={t('tabs.sessions')} value={security.stats.activeSessions} subtitle={t('stats.activeSessions')} icon="🟢" tone="emerald" />
        <StatCard title={t('tabs.failedLogins')} value={security.stats.failedAttemptsToday} subtitle={t('stats.failedToday')} icon="🚫" tone="red" />
        <StatCard title={t('stats.twoFactorTitle')} value={security.stats.twoFactorUsers} subtitle={t('stats.twoFactorUsers')} icon="🔐" tone="blue" />
        <StatCard title={t('tabs.rateLimits')} value={security.stats.blockedRateLimits} subtitle={t('stats.blockedRateLimits')} icon="⏱️" tone="amber" />
      </section>

      <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm" aria-label={t('tabs.navigation')}>
        <a href="#sessions" className="whitespace-nowrap rounded-xl bg-[#1a1a2e] px-4 py-2 text-sm font-extrabold text-white">{t('tabs.sessions')}</a>
        <a href="#failed-logins" className="whitespace-nowrap rounded-xl px-4 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-100">{t('tabs.failedLogins')}</a>
        <a href="#audit-log" className="whitespace-nowrap rounded-xl px-4 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-100">{t('tabs.auditLog')}</a>
        <a href="#rate-limits" className="whitespace-nowrap rounded-xl px-4 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-100">{t('tabs.rateLimits')}</a>
      </nav>

      <SessionsTab sessions={security.activeSessions} />
      <FailedLoginsTab attempts={security.failedLoginAttempts} />
      <AuditLogTab logs={security.auditLogs} />
      <RateLimitsTab limits={security.rateLimits} />
    </div>
  );
}
