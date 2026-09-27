'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toggleUserActive } from '@/app/actions/admin';

export function SuspendUserButton({ userId, isActive }: { userId: number; isActive: boolean }) {
  const t = useTranslations('admin.uiActions');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState('');
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" onClick={() => setOpen(true)} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100">{isActive ? t('suspend') : t('activate')}</button>
    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-lg font-extrabold text-[#1a1a2e]">{isActive ? t('suspendUser') : t('activateUser')}</h2><p className="mt-2 text-sm text-slate-600">{t('confirmAction')}</p><div className="mt-6 flex justify-end gap-2"><button onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2 text-sm font-bold">{t('cancel')}</button><button disabled={pending} onClick={() => startTransition(async()=>{const r=await toggleUserActive(userId); setToast(r.message ?? 'تم'); setOpen(false); router.refresh();})} className="rounded-xl bg-[#1a1a2e] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{t('confirm')}</button></div></div></div>}
    {toast && <div className="fixed bottom-4 left-4 z-50 rounded-xl bg-[#1a1a2e] px-4 py-2 text-sm font-bold text-white shadow-lg">{toast}</div>}
  </>;
}
