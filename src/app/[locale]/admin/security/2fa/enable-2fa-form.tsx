'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { cancel2FASetup, generate2FASecret, verify2FACode } from '@/app/actions/2fa';
import type { AuthActionState } from '@/lib/auth';

const initialState: AuthActionState = { success: false };

interface Enable2FAFormProps {
  initialQrCodeUrl?: string | null;
  initialSecret?: string | null;
}

export function Enable2FAForm({ initialQrCodeUrl = null, initialSecret = null }: Enable2FAFormProps) {
  const t = useTranslations('admin.twoFactor');
  const router = useRouter();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(initialQrCodeUrl);
  const [secret, setSecret] = useState<string | null>(initialSecret);
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  const [state, action] = useActionState(verify2FACode, initialState);

  useEffect(() => {
    if (state.success) router.refresh();
  }, [router, state.success]);

  const startSetup = () => {
    setMessage('');
    startTransition(async () => {
      const result = await generate2FASecret();
      if (result.success) {
        setQrCodeUrl(result.qrCodeUrl ?? null);
        setSecret(result.secret ?? null);
        router.refresh();
      } else {
        setMessage(result.message ?? 'تعذر بدء الإعداد');
      }
    });
  };

  const cancelSetup = () => {
    startTransition(async () => {
      const result = await cancel2FASetup();
      setMessage(result.message);
      if (result.success) {
        setQrCodeUrl(null);
        setSecret(null);
        router.refresh();
      }
    });
  };

  if (!qrCodeUrl || !secret) {
    return (
      <div className="space-y-3">
        <button type="button" onClick={startSetup} disabled={pending} className="rounded-xl bg-[#1a1a2e] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{pending ? 'جارٍ التجهيز...' : t('enable')}</button>
        {message && <p className="text-sm font-bold text-slate-600">{message}</p>}
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h2 className="text-xl font-extrabold text-[#1a1a2e]">{t('title')}</h2>
      <p className="mt-2 text-sm text-slate-500">{t('scanQr')}</p>
      <div className="mt-5 grid place-items-center rounded-2xl bg-white p-4">
        <img src={qrCodeUrl} alt="2FA QR Code" className="h-56 w-56" />
      </div>
      <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
        <b>{t('warning')}</b>
        <code className="mt-2 block break-all" dir="ltr">{secret}</code>
      </div>
      <form action={action} className="mt-5 space-y-3">
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          {t('enterCode')}
          <input name="code" inputMode="numeric" autoComplete="one-time-code" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-lg tracking-[0.4em]" dir="ltr" maxLength={6} />
        </label>
        {state.message && <p className={state.success ? 'text-sm font-bold text-emerald-600' : 'text-sm font-bold text-red-600'}>{state.message}</p>}
        {message && <p className="text-sm font-bold text-slate-600">{message}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={cancelSetup} disabled={pending} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-50">إلغاء الإعداد</button>
          <button disabled={pending} className="rounded-xl bg-[#2386c8] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{t('verify')}</button>
        </div>
      </form>
    </div>
  );
}
