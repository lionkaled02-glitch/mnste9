'use client';

import { useActionState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { verify2FAOnLogin } from '@/app/actions/2fa';
import type { AuthActionState } from '@/lib/auth';

const initialState: AuthActionState = { success: false };

export default function Verify2FALoginPage() {
  const t = useTranslations('admin.twoFactor');
  const params = useSearchParams();
  const router = useRouter();
  const email = params.get('email') ?? '';
  const [state, action, pending] = useActionState(verify2FAOnLogin, initialState);
  useEffect(() => { if (state.success && state.redirectTo) router.replace(state.redirectTo); }, [router, state]);
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-4" dir="rtl"><form action={action} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"><h1 className="text-2xl font-extrabold text-[#1a1a2e]">{t('title')}</h1><p className="mt-2 text-sm text-slate-500">{t('enterCode')}</p><input type="hidden" name="email" value={email}/><input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="mt-5 w-full rounded-xl border border-slate-200 px-3 py-3 text-center text-xl tracking-[0.45em]" dir="ltr" />{state.message && <p className={state.success?'mt-3 text-sm font-bold text-emerald-600':'mt-3 text-sm font-bold text-red-600'}>{state.message}</p>}<button disabled={pending} className="mt-5 w-full rounded-xl bg-[#1a1a2e] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{t('verify')}</button></form></main>;
}
