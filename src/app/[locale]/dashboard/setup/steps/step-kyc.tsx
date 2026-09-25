'use client';

import { useActionState, useEffect } from 'react';

import { submitSetupKycAction } from '@/app/actions/setup';
import type { AuthActionState } from '@/lib/auth';
import { KYC_MAX_FILE_SIZE_BYTES } from '@/lib/services/kyc-meta';

import { KycDynamicForm } from './kyc-dynamic-form';

const INITIAL_STATE: AuthActionState = { success: false };

export function StepKyc({ alreadySubmitted, onComplete }: { alreadySubmitted: boolean; onComplete: () => void }) {
  const [state, formAction, isPending] = useActionState(submitSetupKycAction, INITIAL_STATE);

  useEffect(() => {
    if (state.success || alreadySubmitted) onComplete();
  }, [state.success, alreadySubmitted, onComplete]);

  if (alreadySubmitted) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
        تم استلام وثائق التوثيق مسبقاً. سننقلك للخطوة التالية…
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <KycDynamicForm disabled={isPending} errors={state.fieldErrors} />

      <p className="rounded-xl border border-[#2386c8]/15 bg-[#2386c8]/5 px-4 py-3 text-xs leading-6 text-slate-600">
        الملفات تُشفّر وتُراجع من فريق التوثيق. الحد الأقصى {Math.round(KYC_MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB لكل ملف.
        الحقول التفصيلية تُستخدم للتحقق حالياً، وتحتاج حقولاً مخصصة في قاعدة البيانات للتخزين الدائم.
      </p>

      {state.message && !state.success && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p>}

      <button type="submit" disabled={isPending} className="rounded-xl bg-[#2386c8] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1a6da8] disabled:opacity-60">
        {isPending ? 'جارٍ الرفع…' : 'رفع الوثائق والمتابعة'}
      </button>
    </form>
  );
}
