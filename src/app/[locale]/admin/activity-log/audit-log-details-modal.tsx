'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { ExportButton } from '@/components/admin/export-modal';

type AuditLogRow = {
  id: number;
  adminId: number;
  adminName: string | null;
  action: string;
  targetType: string | null;
  targetId: number | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date | string;
};

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString('ar');
}

function labelAction(action: string, translate: (key: string) => string) {
  try {
    const translated = translate(action);
    if (translated === action || translated.startsWith('admin.security.actions.')) return action.replace(/_/g, ' ');
    return translated;
  } catch {
    return action.replace(/_/g, ' ');
  }
}

export function AuditLogDetailsModal({ log, open, onClose }: { log: AuditLogRow | null; open: boolean; onClose: () => void }) {
  const actionT = useTranslations('admin.security.actions');
  if (!open || !log) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <h2 className="mb-4 text-xl font-bold text-[#1a1a2e]">تفاصيل النشاط</h2>
        <dl className="space-y-3 text-sm">
          <div><dt className="font-bold text-slate-500">المشرف</dt><dd>{log.adminName ?? `#${log.adminId}`}</dd></div>
          <div><dt className="font-bold text-slate-500">الإجراء</dt><dd>{labelAction(log.action, actionT)}</dd></div>
          <div><dt className="font-bold text-slate-500">الهدف</dt><dd>{log.targetType ?? '—'} {log.targetId ? `#${log.targetId}` : ''}</dd></div>
          <div><dt className="font-bold text-slate-500">IP</dt><dd dir="ltr">{log.ip ?? '—'}</dd></div>
          <div><dt className="font-bold text-slate-500">User Agent</dt><dd className="break-all text-xs text-slate-400" dir="ltr">{log.userAgent ?? '—'}</dd></div>
          <div><dt className="font-bold text-slate-500">التاريخ</dt><dd>{formatDate(log.createdAt)}</dd></div>
          {log.metadata && <div><dt className="font-bold text-slate-500">بيانات إضافية</dt><dd className="rounded-lg bg-slate-50 p-3 font-mono text-xs" dir="ltr"><pre>{JSON.stringify(log.metadata, null, 2)}</pre></dd></div>}
        </dl>
        <button type="button" onClick={onClose} className="mt-6 w-full rounded-lg bg-[#1a1a2e] px-4 py-2.5 text-sm font-bold text-white">إغلاق</button>
      </div>
    </div>
  );
}

export function AuditLogInteractiveList({ logs }: { logs: AuditLogRow[] }) {
  const actionT = useTranslations('admin.security.actions');
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex justify-end">
        <ExportButton title="سجل-الأنشطة" data={logs.map((log) => ({ admin: log.adminName ?? `#${log.adminId}`, action: labelAction(log.action, actionT), target: `${log.targetType ?? '—'} ${log.targetId ? `#${log.targetId}` : ''}`, ip: log.ip ?? '', date: formatDate(log.createdAt) }))} columns={[{ key: 'admin', label: 'المشرف' }, { key: 'action', label: 'الإجراء' }, { key: 'target', label: 'الكائن' }, { key: 'ip', label: 'IP' }, { key: 'date', label: 'التاريخ' }]} />
      </div>
      <div className="space-y-3">
        {logs.map((log) => (
          <button type="button" key={log.id} onClick={() => setSelectedLog(log)} className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-right transition hover:bg-[#2386c8]/10">
            <span><b>{labelAction(log.action, actionT)}</b><span className="ms-2 text-sm text-slate-500">{log.targetType ?? '—'} {log.targetId ? `#${log.targetId}` : ''}</span></span>
            <time className="text-xs text-slate-500">{formatDate(log.createdAt)}</time>
          </button>
        ))}
      </div>
      <AuditLogDetailsModal log={selectedLog} open={Boolean(selectedLog)} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
