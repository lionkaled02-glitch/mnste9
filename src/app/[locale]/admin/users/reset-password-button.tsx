'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { resetUserPassword } from '@/app/actions/admin';

export function ResetPasswordButton({ userId }: { userId: number }) {
  const t = useTranslations('admin.uiActions');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  return <>
    <button type="button" onClick={() => setOpen(true)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-[#2386c8]">{t('resetPassword')}</button>
    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-lg font-extrabold text-[#1a1a2e]">{t('resetPassword')}</h2><p className="mt-2 text-sm text-slate-600">{t('resetPasswordDesc')}</p>{password && <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700" dir="ltr">{password}</div>}<div className="mt-6 flex justify-end gap-2"><button onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2 text-sm font-bold">{t('close')}</button><button disabled={pending} onClick={() => startTransition(async()=>{const r=await resetUserPassword(userId); if(r.success && 'password' in r) setPassword(String(r.password)); router.refresh();})} className="rounded-xl bg-[#1a1a2e] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{t('generate')}</button></div></div></div>}
  </>;
}
