'use client';

import { useActionState, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

import { generate2FASecret, verify2FACode } from '@/app/actions/2fa';
import type { AuthActionState } from '@/lib/auth';

const initialState: AuthActionState = { success: false };

export function Enable2FAForm() {
  const t = useTranslations('admin.twoFactor');
  const [open, setOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [state, action] = useActionState(verify2FACode, initialState);

  const startSetup = () => {
    setOpen(true);
    startTransition(async () => {
      const result = await generate2FASecret();
      if (result.success) {
        setQrCodeUrl(result.qrCodeUrl ?? null);
        setSecret(result.secret ?? null);
      }
    });
  };

  return (
    <>
      <button type="button" onClick={startSetup} className="rounded-xl bg-[#1a1a2e] px-5 py-2.5 text-sm font-bold text-white">{t('enable')}</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-extrabold text-[#1a1a2e]">{t('title')}</h2>
            <p className="mt-2 text-sm text-slate-500">{t('scanQr')}</p>
            <div className="mt-5 grid place-items-center rounded-2xl bg-slate-50 p-4">
              {qrCodeUrl ? <img src={qrCodeUrl} alt="2FA QR Code" className="h-56 w-56" /> : <p className="text-sm text-slate-500">جارٍ توليد QR...</p>}
            </div>
            {secret && <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800"><b>{t('warning')}</b><code className="mt-2 block break-all" dir="ltr">{secret}</code></div>}
            <form action={action} className="mt-5 space-y-3">
              <label className="grid gap-1 text-sm font-bold text-slate-700">{t('enterCode')}<input name="code" inputMode="numeric" autoComplete="one-time-code" className="rounded-xl border border-slate-200 px-3 py-2 text-center text-lg tracking-[0.4em]" dir="ltr" maxLength={6} /></label>
              {state.message && <p className={state.success ? 'text-sm font-bold text-emerald-600' : 'text-sm font-bold text-red-600'}>{state.message}</p>}
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2 text-sm font-bold">إلغاء</button><button disabled={pending} className="rounded-xl bg-[#2386c8] px-4 py-2 text-sm font-bold text-white">{t('verify')}</button></div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
