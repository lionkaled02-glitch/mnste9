'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

import { disable2FA } from '@/app/actions/2fa';

export function Disable2FAButton() {
  const t = useTranslations('admin.twoFactor');
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  return <div className="space-y-3"><button type="button" disabled={pending} onClick={() => { if (confirm(t('disable'))) startTransition(async () => { const result = await disable2FA(); setMessage(result.message); router.refresh(); }); }} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{t('disable')}</button>{message && <p className="text-sm font-bold text-slate-600">{message}</p>}</div>;
}
