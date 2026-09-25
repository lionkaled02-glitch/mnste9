'use client';

import { useActionState, useEffect } from 'react';

import { updateSetupPhoneAction } from '@/app/actions/setup';
import type { AuthActionState } from '@/lib/auth';

const INITIAL_STATE: AuthActionState = { success: false };

export function StepPhone({ initialPhone, onComplete }: { initialPhone: string | null; onComplete: () => void }) {
  const [state, formAction, isPending] = useActionState(updateSetupPhoneAction, INITIAL_STATE);
  const error = state.fieldErrors?.phone?.[0];

  useEffect(() => {
    if (state.success) onComplete();
  }, [state.success, onComplete]);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div>
        <label htmlFor="setup-phone" className="mb-2 block text-sm font-bold text-slate-800">رقم الجوال</label>
        <input
          id="setup-phone"
          name="phone"
          type="tel"
          dir="ltr"
          required
          maxLength={30}
          defaultValue={initialPhone ?? ''}
          placeholder="+967771234567"
          className={`w-full rounded-xl border px-4 py-3 text-left outline-none transition focus:ring-2 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-[#2386c8] focus:ring-[#2386c8]/20'}`}
        />
        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : <p className="mt-2 text-xs text-slate-500">استخدم صيغة دولية. سنستخدمه للتنبيهات المهمة فقط.</p>}
      </div>

      {state.message && !state.success && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p>}

      <button type="submit" disabled={isPending} className="rounded-xl bg-[#2386c8] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1a6da8] disabled:opacity-60">
        {isPending ? 'جارٍ الحفظ…' : 'حفظ ومتابعة'}
      </button>
    </form>
  );
}
