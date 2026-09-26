'use client';

import { useCallback, useEffect, useState, useTransition, type FormEvent } from 'react';

import { submitSetupKycAction } from '@/app/actions/setup';
import type { AuthActionState } from '@/lib/auth';
import { KYC_MAX_FILE_SIZE_BYTES } from '@/lib/services/kyc-meta';

import { KycDynamicForm, type KycFiles } from './kyc-dynamic-form';

const INITIAL_STATE: AuthActionState = { success: false };
const EMPTY_FILES: KycFiles = { frontDocument: null, backDocument: null, selfieDocument: null };

function buildKycFormData(form: HTMLFormElement, files: KycFiles): FormData {
  const formData = new FormData(form);
  formData.delete('frontDocument');
  formData.delete('backDocument');
  formData.delete('selfieDocument');
  formData.delete('frontFile');
  formData.delete('backFile');
  formData.delete('selfieFile');

  if (files.frontDocument) formData.set('frontDocument', files.frontDocument);
  if (files.backDocument) formData.set('backDocument', files.backDocument);
  if (files.selfieDocument) formData.set('selfieDocument', files.selfieDocument);

  return formData;
}

export function StepKyc({ alreadySubmitted, onComplete }: { alreadySubmitted: boolean; onComplete: () => void }) {
  const [state, setState] = useState<AuthActionState>(INITIAL_STATE);
  const [files, setFiles] = useState<KycFiles>(EMPTY_FILES);
  const [isPending, startTransition] = useTransition();

  const handleFilesChange = useCallback((nextFiles: KycFiles) => {
    setFiles(nextFiles);
  }, []);

  useEffect(() => {
    if (state.success || alreadySubmitted) onComplete();
  }, [state.success, alreadySubmitted, onComplete]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = buildKycFormData(event.currentTarget, files);
    startTransition(async () => {
      const result = await submitSetupKycAction(state, formData);
      setState(result);
    });
  };

  if (alreadySubmitted) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
        تم استلام وثائق التوثيق مسبقاً. سننقلك للخطوة التالية…
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <KycDynamicForm disabled={isPending} errors={state.fieldErrors} onFilesChange={handleFilesChange} />

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
