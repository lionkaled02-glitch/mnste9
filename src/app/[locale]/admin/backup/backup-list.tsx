'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { deleteBackupAction, restoreBackupAction, type BackupFileInfo } from '@/app/actions/backup';

export function BackupList({ backups }: { backups: BackupFileInfo[] }) {
  const t = useTranslations('admin.backup');
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const [confirmationText, setConfirmationText] = useState('');

  const handleRestore = async (filename: string) => {
    setRestoring(filename);
    const result = await restoreBackupAction(filename, confirmationText.trim());
    setRestoring(null);
    if (result.success) {
      setConfirmRestore(null);
      setConfirmationText('');
      alert(t('restoreSuccess'));
      window.location.reload();
    } else {
      alert(`✗ ${result.message ?? t('restoreFailed')}`);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(t('deleteConfirm', { filename }))) return;
    setDeleting(filename);
    const result = await deleteBackupAction(filename);
    setDeleting(null);
    if (result.success) window.location.reload();
    else alert(`✗ ${result.message ?? t('deleteFailed')}`);
  };

  if (backups.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
        <p className="font-bold text-slate-500">{t('empty')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-500">{t('filename')}</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-500">{t('size')}</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-500">{t('date')}</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-500">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((backup) => (
                <tr key={backup.filename} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700" dir="ltr">{backup.filename}</td>
                  <td className="px-4 py-3 text-sm">{(backup.size / 1024).toFixed(2)} KB</td>
                  <td className="px-4 py-3 text-sm">{new Date(backup.createdAt).toLocaleString('ar')}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`/api/admin/backup/download?filename=${encodeURIComponent(backup.filename)}`}
                        className="rounded-lg bg-[#2386c8]/10 px-3 py-1.5 text-xs font-bold text-[#2386c8] transition hover:bg-[#2386c8]/20"
                      >
                        {t('download')}
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmRestore(backup.filename);
                          setConfirmationText('');
                        }}
                        className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800 transition hover:bg-amber-200"
                      >
                        {t('restore')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(backup.filename)}
                        disabled={deleting === backup.filename}
                        className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-800 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deleting === backup.filename ? '...' : t('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {confirmRestore ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmRestore(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-right shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <h2 className="mb-2 text-xl font-extrabold text-[#1a1a2e]">{t('confirmRestore.title')}</h2>
            <p className="mb-4 text-sm text-slate-500">{t('confirmRestore.message')}</p>
            <ul className="mb-4 list-inside list-disc space-y-1 text-sm text-slate-600">
              <li>{t('confirmRestore.itemDelete')}</li>
              <li>{t('confirmRestore.itemReplace')}</li>
              <li>{t('confirmRestore.itemIrreversible')}</li>
            </ul>
            <label className="mb-4 block space-y-2 text-sm font-bold text-slate-700">
              <span>{t('confirmRestore.typeInstruction')}</span>
              <input
                value={confirmationText}
                onChange={(event) => setConfirmationText(event.target.value)}
                placeholder="استعادة"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleRestore(confirmRestore)}
                disabled={restoring === confirmRestore || confirmationText.trim() !== 'استعادة'}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {restoring === confirmRestore ? t('restoring') : t('confirmRestore.confirm')}
              </button>
              <button
                type="button"
                onClick={() => setConfirmRestore(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-bold transition hover:bg-slate-50"
              >
                {t('confirmRestore.cancel')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
