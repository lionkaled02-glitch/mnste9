'use client';

import { useActionState } from 'react';

import { uploadKycDocumentsAction } from '@/app/actions/kyc';
import { KycDynamicForm } from '@/app/[locale]/dashboard/setup/steps/kyc-dynamic-form';
import type { AuthActionState } from '@/lib/auth';
import { KYC_MAX_FILE_SIZE_BYTES } from '@/lib/services/kyc-meta';

const INITIAL_STATE: AuthActionState = { success: false };

export function KycUploadForm() {
  const [state, formAction, isPending] = useActionState(uploadKycDocumentsAction, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.message && !state.success && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p>}
      {state.success && state.message && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.message}</p>}

      <KycDynamicForm disabled={isPending} errors={state.fieldErrors} />

      <div className="flex gap-2 rounded-xl border border-[#2386c8]/15 bg-[#2386c8]/[0.06] px-4 py-3">
        <span className="mt-0.5 text-[#2386c8]">🔒</span>
        <p className="text-xs leading-6 text-slate-600">
          تُشفَّر الملفات AES-256-GCM وتُخزن خارج DB — لا يراها إلا فريق التوثيق. الحد الأقصى {Math.round(KYC_MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB لكل ملف.
        </p>
      </div>

      <button type="submit" disabled={isPending} className="rounded-xl bg-[#2386c8] px-8 py-3 text-sm font-bold text-white transition hover:bg-[#1a6da8] focus:outline-none focus:ring-2 focus:ring-[#2386c8]/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
        {isPending ? 'جارٍ رفع الوثائق…' : 'رفع الوثائق للمراجعة'}
      </button>
    </form>
  );
}
