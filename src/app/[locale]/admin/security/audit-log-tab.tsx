'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { DataTable } from '@/components/admin/data-table';
import { ExportButton } from '@/components/admin/export-modal';

type AuditLogRow = {
  id: number;
  adminId: number;
  adminName: string | null;
  action: string;
  targetType: string | null;
  targetId: number | null;
  metadata?: Record<string, unknown> | null;
  ip: string | null;
  userAgent?: string | null;
  createdAt: Date | string;
};

function formatDate(value: Date | string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ar');
}

function toCsvValue(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

export function AuditLogTab({ logs }: { logs: AuditLogRow[] }) {
  const t = useTranslations('admin.security.auditLog');
  const actionT = useTranslations('admin.security.actions');
  const [adminFilter, setAdminFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [hoursFilter, setHoursFilter] = useState('');

  const admins = useMemo(() => Array.from(new Map(logs.map((log) => [String(log.adminId), log.adminName ?? `#${log.adminId}`])).entries()), [logs]);
  const actions = useMemo(() => Array.from(new Set(logs.map((log) => log.action))).sort(), [logs]);

  const visibleLogs = useMemo(() => {
    const since = hoursFilter ? Date.now() - Number(hoursFilter) * 60 * 60 * 1000 : null;
    return logs.filter((log) => {
      if (adminFilter && String(log.adminId) !== adminFilter) return false;
      if (actionFilter && log.action !== actionFilter) return false;
      if (since && new Date(log.createdAt).getTime() < since) return false;
      return true;
    });
  }, [adminFilter, actionFilter, hoursFilter, logs]);

  const labelAction = (action: string) => {
    try {
      const translated = actionT(action);
      if (translated === action || translated.startsWith('admin.security.actions.')) return action.replace(/_/g, ' ');
      return translated;
    } catch {
      return action.replace(/_/g, ' ');
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" id="audit-log">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#1a1a2e]">{t('title')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('subtitle')}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          <select value={adminFilter} onChange={(event) => setAdminFilter(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="">{t('allAdmins')}</option>
            {admins.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="">{t('allActions')}</option>
            {actions.map((action) => <option key={action} value={action}>{labelAction(action)}</option>)}
          </select>
          <select value={hoursFilter} onChange={(event) => setHoursFilter(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="">{t('allDates')}</option>
            <option value="24">{t('last24h')}</option>
            <option value="168">{t('last7d')}</option>
            <option value="720">{t('last30d')}</option>
          </select>
          <ExportButton title="audit-log" data={visibleLogs.map((log) => ({ admin: log.adminName ?? `#${log.adminId}`, action: labelAction(log.action), target: `${log.targetType ?? '—'} ${log.targetId ? `#${log.targetId}` : ''}`.trim(), ip: log.ip ?? '', date: formatDate(log.createdAt) }))} columns={[{ key: 'admin', label: t('admin') }, { key: 'action', label: t('action') }, { key: 'target', label: t('target') }, { key: 'ip', label: t('ip') }, { key: 'date', label: t('date') }]} />
        </div>
      </div>

      <DataTable columns={[t('admin'), t('action'), t('target'), t('ip'), t('date')]} empty={visibleLogs.length === 0} emptyTitle={t('empty')}>
        {visibleLogs.map((log) => (
          <tr key={log.id}>
            <td className="px-4 py-3 font-bold">{log.adminName ?? `#${log.adminId}`}</td>
            <td className="px-4 py-3">{labelAction(log.action)}</td>
            <td className="px-4 py-3">{log.targetType ?? '—'} {log.targetId ? `#${log.targetId}` : ''}</td>
            <td className="px-4 py-3" dir="ltr">{log.ip ?? '—'}</td>
            <td className="px-4 py-3 whitespace-nowrap">{formatDate(log.createdAt)}</td>
          </tr>
        ))}
      </DataTable>
    </section>
  );
}
