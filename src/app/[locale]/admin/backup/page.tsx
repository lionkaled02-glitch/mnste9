import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { listBackupsAction } from '@/app/actions/backup';
import { getCurrentUser } from '@/lib/auth';

import { BackupList } from './backup-list';
import { CreateBackupButton } from './create-backup-button';

export const metadata: Metadata = {
  title: 'النسخ الاحتياطي | خدمات',
};

export default async function AdminBackupPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') redirect('/dashboard');

  const t = await getTranslations('admin.backup');
  const result = await listBackupsAction();
  const backups = result.backups ?? [];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="rounded-2xl bg-[#1a1a2e] p-6 text-white shadow-sm">
        <h1 className="text-3xl font-extrabold">{t('title')}</h1>
        <p className="mt-2 text-slate-300">{t('subtitle')}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1a1a2e]">{t('available')} ({backups.length})</h2>
            <p className="mt-1 text-sm text-slate-500">{t('storageNote')}</p>
          </div>
          <CreateBackupButton />
        </div>
      </div>

      <BackupList backups={backups} />
    </div>
  );
}
