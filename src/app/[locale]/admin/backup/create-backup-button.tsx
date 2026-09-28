'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { createBackupAction } from '@/app/actions/backup';

export function CreateBackupButton() {
  const t = useTranslations('admin.backup');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleCreate = async () => {
    setLoading(true);
    setMessage('');
    const result = await createBackupAction();
    setLoading(false);
    if (result.success) {
      setMessage(`✓ ${t('createdMessage', { filename: result.filename ?? '', count: result.recordsCount ?? 0 })}`);
      window.location.reload();
    } else {
      setMessage(`✗ ${result.message ?? t('createFailed')}`);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={handleCreate}
        disabled={loading}
        className="rounded-xl bg-[#2386c8] px-6 py-3 font-bold text-white transition hover:bg-[#1a6da8] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? t('creating') : `+ ${t('create')}`}
      </button>
      {message ? <p className="text-sm font-semibold text-slate-600">{message}</p> : null}
    </div>
  );
}
