'use client';

import { useActionState, useEffect } from 'react';

import { submitSetupKycAction } from '@/app/actions/setup';
import type { AuthActionState } from '@/lib/auth';
import { KYC_ALLOWED_MIME_TYPES, KYC_DOCUMENT_TYPE_OPTIONS, KYC_MAX_FILE_SIZE_BYTES } from '@/lib/services/kyc-meta';

const INITIAL_STATE: AuthActionState = { success: false };

const FILE_FIELDS = [
  { name: 'frontDocument', id: 'setup-kyc-front', label: 'الوجه الأمامي للهوية/الجواز' },
  { name: 'backDocument', id: 'setup-kyc-back', label: 'الوجه الخلفي' },
  { name: 'selfieDocument', id: 'setup-kyc-selfie', label: 'سيلفي مع الوثيقة' },
] as const;

export function StepKyc({ alreadySubmitted, onComplete }: { alreadySubmitted: boolean; onComplete: () => void }) {
  const [state, formAction, isPending] = useActionState(submitSetupKycAction, INITIAL_STATE);
  const typeError = state.fieldErrors?.documentType?.[0];

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
      <div>
        <label htmlFor="setup-kyc-type" className="mb-2 block text-sm font-bold text-slate-800">نوع الوثيقة</label>
        <select id="setup-kyc-type" name="documentType" required defaultValue="" disabled={isPending} className={`w-full rounded-xl border bg-white px-4 py-3 outline-none focus:ring-2 ${typeError ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-[#2386c8] focus:ring-[#2386c8]/20'}`}>
          <option value="" disabled>اختر نوع الوثيقة</option>
          {KYC_DOCUMENT_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        {typeError && <p className="mt-2 text-xs text-red-600">{typeError}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {FILE_FIELDS.map((field) => {
          const fileError = state.fieldErrors?.[field.name]?.[0];
          return (
            <div key={field.name} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label htmlFor={field.id} className="block text-xs font-bold text-slate-800">{field.label}</label>
              <input id={field.id} name={field.name} type="file" required accept={KYC_ALLOWED_MIME_TYPES.join(',')} disabled={isPending} className="mt-3 w-full text-xs file:me-3 file:rounded-lg file:border-0 file:bg-[#2386c8]/10 file:px-3 file:py-2 file:font-bold file:text-[#2386c8]" />
              {fileError && <p className="mt-2 text-xs text-red-600">{fileError}</p>}
            </div>
          );
        })}
      </div>

      <p className="rounded-xl border border-[#2386c8]/15 bg-[#2386c8]/5 px-4 py-3 text-xs leading-6 text-slate-600">
        الملفات تُشفّر وتُراجع من فريق التوثيق. الحد الأقصى {Math.round(KYC_MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB لكل ملف.
      </p>

      {state.message && !state.success && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p>}

      <button type="submit" disabled={isPending} className="rounded-xl bg-[#2386c8] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1a6da8] disabled:opacity-60">
        {isPending ? 'جارٍ الرفع…' : 'رفع الوثائق والمتابعة'}
      </button>
    </form>
  );
}
