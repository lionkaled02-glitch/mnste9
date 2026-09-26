'use client';

import { useCallback, useState, useTransition, type FormEvent } from 'react';

import { uploadKycDocumentsAction } from '@/app/actions/kyc';
import { KycDynamicForm, type KycFiles } from '@/app/[locale]/dashboard/setup/steps/kyc-dynamic-form';
import type { AuthActionState } from '@/lib/auth';
import { KYC_MAX_FILE_SIZE_BYTES } from '@/lib/services/kyc-meta';

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

export function KycUploadForm() {
  const [state, setState] = useState<AuthActionState>(INITIAL_STATE);
  const [files, setFiles] = useState<KycFiles>(EMPTY_FILES);
  const [isPending, startTransition] = useTransition();

  const handleFilesChange = useCallback((nextFiles: KycFiles) => {
    setFiles(nextFiles);
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = buildKycFormData(event.currentTarget, files);
    startTransition(async () => {
      const result = await uploadKycDocumentsAction(state, formData);
      setState(result);
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {state.message && !state.success && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p>}
      {state.success && state.message && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.message}</p>}

      <KycDynamicForm disabled={isPending} errors={state.fieldErrors} onFilesChange={handleFilesChange} />

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
