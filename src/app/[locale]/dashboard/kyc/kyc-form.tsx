'use client';

/**
 * خدمات — نموذج رفع KYC — إعادة تصميم #2386c8
 * - أمامي + خلفي + سيلفي (3 ملفات إلزامية حالياً)
 * - تشفير AES-256-GCM في الخادم
 */

import { useActionState } from 'react';

import { uploadKycDocumentsAction } from '@/app/actions/kyc';
import type { AuthActionState } from '@/lib/auth';
import {
  KYC_ALLOWED_MIME_TYPES,
  KYC_DOCUMENT_TYPE_OPTIONS,
  KYC_MAX_FILE_SIZE_BYTES,
} from '@/lib/services/kyc-meta';

const INITIAL_STATE: AuthActionState = { success: false };

const INPUT_CLASSES =
  'w-full rounded-[10px] border px-4 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2';

const FILE_INPUT_CLASSES =
  'w-full rounded-[10px] border px-4 py-2.5 text-[12px] text-gray-900 outline-none transition focus:ring-2 file:ms-2 file:rounded-[6px] file:border-0 file:bg-[#2386c8]/10 file:px-3 file:py-1.5 file:text-[11px] file:font-bold file:text-[#2386c8] hover:file:bg-[#2386c8]/20';

const FILE_FIELDS = [
  { name: 'frontDocument', id: 'kyc-front-document', label: 'الوجه الأمامي للهوية/الجواز', hint: 'صورة واضحة — كل الزوايا ظاهرة' },
  { name: 'backDocument', id: 'kyc-back-document', label: 'الوجه الخلفي', hint: 'اختياري إذا كان الجواز — مطلوب للبطاقة' },
  { name: 'selfieDocument', id: 'kyc-selfie-document', label: 'سيلفي مع الوثيقة', hint: 'وجهك + الوثيقة بجانب الوجه — إثبات الحيوية' },
] as const;

export function KycUploadForm() {
  const [state, formAction, isPending] = useActionState(uploadKycDocumentsAction, INITIAL_STATE);

  const typeError = state.fieldErrors?.documentType?.[0];

  const inputClasses = (hasError: boolean): string =>
    `${INPUT_CLASSES} ${
      hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-[#2386c8] focus:ring-[#2386c8]/20'
    }`;

  const fileInputClasses = (hasError: boolean): string =>
    `${FILE_INPUT_CLASSES} ${
      hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-[#2386c8] focus:ring-[#2386c8]/20'
    }`;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.message && !state.success && (
        <p className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">{state.message}</p>
      )}
      {state.success && state.message && (
        <p className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] text-emerald-700">{state.message}</p>
      )}

      <div>
        <label htmlFor="kyc-document-type" className="mb-2 block text-[12px] font-bold text-[#444]">
          نوع الوثيقة
        </label>
        <select
          id="kyc-document-type"
          name="documentType"
          required
          defaultValue=""
          disabled={isPending}
          className={`${inputClasses(Boolean(typeError))} bg-white`}
        >
          <option value="" disabled>
            اختر نوع الوثيقة
          </option>
          {KYC_DOCUMENT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {typeError && <p className="mt-1.5 text-[11px] text-red-600">{typeError}</p>}
      </div>

      <div className="space-y-4">
        {FILE_FIELDS.map((field) => {
          const fileError = state.fieldErrors?.[field.name]?.[0];
          return (
            <div key={field.name} className="rounded-[10px] border border-gray-200 bg-[#fcfcfc] p-4">
              <label htmlFor={field.id} className="block text-[12px] font-bold text-[#222]">
                {field.label}
              </label>
              <p className="mt-1 text-[11px] text-[#888]">{field.hint}</p>
              <input
                id={field.id}
                name={field.name}
                type="file"
                required={field.name !== 'backDocument'}
                accept={KYC_ALLOWED_MIME_TYPES.join(',')}
                disabled={isPending}
                className={`mt-3 ${fileInputClasses(Boolean(fileError))} bg-white`}
              />
              {fileError ? (
                <p className="mt-1.5 text-[11px] text-red-600">{fileError}</p>
              ) : (
                <p className="mt-1.5 text-[10px] text-[#999]">
                  JPG/PNG/WEBP/PDF حتى {Math.round(KYC_MAX_FILE_SIZE_BYTES / (1024 * 1024))} MB — إضاءة جيدة ونص مقروء
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-[10px] border border-[#2386c8]/15 bg-[#2386c8]/[0.06] px-4 py-3 flex gap-2">
        <span className="text-[#2386c8] text-[12px] mt-0.5">🔒</span>
        <p className="text-[11px] leading-6 text-[#444]">
          تُشفَّر الملفات AES-256-GCM وتُخزن خارج DB — لا يراها إلا فريق التوثيق. لا مشاركة مع العملاء. تحميك من انتحال الهوية وتزيد ثقة العملاء.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-[10px] bg-[#2386c8] px-8 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#1a6da8] focus:outline-none focus:ring-2 focus:ring-[#2386c8]/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'جارٍ رفع الوثائق…' : 'رفع الوثائق للمراجعة'}
      </button>
    </form>
  );
}
