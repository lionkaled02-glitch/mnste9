'use client';

import { useActionState, useEffect } from 'react';

import { submitSetupPortfolioAction } from '@/app/actions/setup';
import type { AuthActionState } from '@/lib/auth';

import { PortfolioImageUpload } from '../../profile/portfolio-image-upload';

const INITIAL_STATE: AuthActionState = { success: false };

export function StepPortfolio({ onComplete }: { onComplete: () => void }) {
  const [state, formAction, isPending] = useActionState(submitSetupPortfolioAction, INITIAL_STATE);
  const titleError = state.fieldErrors?.title?.[0];
  const descError = state.fieldErrors?.description?.[0];
  const urlError = state.fieldErrors?.externalUrl?.[0];
  const imageError = state.fieldErrors?.imageUrl?.[0];

  useEffect(() => {
    if (state.success) onComplete();
  }, [state.success, onComplete]);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div>
        <label htmlFor="setup-portfolio-title" className="mb-2 block text-sm font-bold text-slate-800">عنوان العمل</label>
        <input id="setup-portfolio-title" name="title" required minLength={3} maxLength={200} placeholder="مثال: متجر إلكتروني متكامل" className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 ${titleError ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-[#2386c8] focus:ring-[#2386c8]/20'}`} />
        {titleError && <p className="mt-2 text-xs text-red-600">{titleError}</p>}
      </div>

      <div>
        <label htmlFor="setup-portfolio-description" className="mb-2 block text-sm font-bold text-slate-800">وصف مختصر</label>
        <textarea id="setup-portfolio-description" name="description" rows={4} maxLength={1000} placeholder="اشرح ما أنجزته والنتيجة التي حققتها للعميل…" className={`w-full resize-y rounded-xl border px-4 py-3 outline-none transition focus:ring-2 ${descError ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-[#2386c8] focus:ring-[#2386c8]/20'}`} />
        {descError && <p className="mt-2 text-xs text-red-600">{descError}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="setup-portfolio-url" className="mb-2 block text-sm font-bold text-slate-800">رابط خارجي اختياري</label>
          <input id="setup-portfolio-url" name="externalUrl" type="url" dir="ltr" maxLength={500} placeholder="https://example.com" className={`w-full rounded-xl border px-4 py-3 text-left outline-none transition focus:ring-2 ${urlError ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-[#2386c8] focus:ring-[#2386c8]/20'}`} />
          {urlError && <p className="mt-2 text-xs text-red-600">{urlError}</p>}
        </div>
        <PortfolioImageUpload serverError={imageError} disabled={isPending} />
      </div>

      {state.message && !state.success && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p>}

      <button type="submit" disabled={isPending} className="rounded-xl bg-[#2386c8] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1a6da8] disabled:opacity-60">
        {isPending ? 'جارٍ الإضافة…' : 'إضافة العمل وإنهاء الإعداد'}
      </button>
    </form>
  );
}
