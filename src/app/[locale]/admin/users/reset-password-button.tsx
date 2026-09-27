'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

import { resetUserPassword, sendPasswordResetEmail } from '@/app/actions/admin';

export function ResetPasswordButton({ userId, userEmail, userName }: { userId: number; userEmail: string; userName: string }) {
  const t = useTranslations('admin.uiActions');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleReset = () => {
    setOpen(true);
    setPassword(null);
    startTransition(async () => {
      const result = await resetUserPassword(userId);
      if (result.success && 'password' in result) setPassword(String(result.password));
      router.refresh();
    });
  };

  const handleCopy = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = async () => {
    if (!password) return;
    setSending(true);
    const result = await sendPasswordResetEmail({ userId, email: userEmail, userName, password });
    setSending(false);
    if (result.success) {
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    }
  };

  return (
    <>
      <button type="button" onClick={handleReset} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-[#2386c8]">{t('resetPassword')}</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-2 text-xl font-bold text-[#1a1a2e]">🔑 {t('resetPassword')}</h2>
            <p className="mb-4 text-sm text-slate-500">المستخدم: <strong>{userName}</strong> <span dir="ltr">({userEmail})</span></p>
            <div className="mb-4 rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-800">⚠️ سيتم إنشاء كلمة مرور جديدة، وإلغاء كل جلسات المستخدم. المستخدم لن يتمكن من الدخول بكلمة المرور القديمة.</div>
            {password ? (
              <>
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-bold text-slate-700">كلمة المرور الجديدة:</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm" dir="ltr">{password}</code>
                    <button type="button" onClick={handleCopy} className="rounded-lg bg-[#2386c8] px-3 py-2 text-sm font-bold text-white">{copied ? '✓ تم النسخ' : '📋 نسخ'}</button>
                  </div>
                  <p className="mt-2 text-xs text-red-600">⚠️ احفظها الآن. لن تظهر مرة أخرى.</p>
                </div>
                <button type="button" onClick={handleSendEmail} disabled={sending} className="mb-4 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">{sending ? 'جارٍ الإرسال...' : sent ? '✓ تم الإرسال' : '📧 إرسال على البريد الإلكتروني'}</button>
                <button type="button" onClick={() => { setOpen(false); setPassword(null); }} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">إغلاق</button>
              </>
            ) : <p className="text-center text-sm text-slate-500">{isPending ? 'جارٍ التوليد...' : 'جارٍ التوليد...'}</p>}
          </div>
        </div>
      )}
    </>
  );
}
