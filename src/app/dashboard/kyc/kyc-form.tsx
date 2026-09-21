'use client';

/**
 * ============================================================================
 *  mnste9 — نموذج رفع وثيقة الهوية (مكوّن عميل — صفحة التوثيق)
 * ============================================================================
 *  الحقول: نوع الوثيقة (بطاقة/جواز/رخصة/أخرى) + الملف (JPG أو PNG أو
 *  WebP أو PDF حتى 5 ميغابايت).
 *
 *  يعمل عبر Server Action (uploadKycDocumentAction) مع useActionState —
 *  الرفع يعمل حتى مع تعطيل JavaScript (نموذج multipart تقليدي)، والمحتوى
 *  يُشفَّر AES-256-GCM في الخادم قبل تخزينه خارج قاعدة البيانات.
 * ============================================================================
 */

import { useActionState } from 'react';

import { uploadKycDocumentAction } from '@/app/actions/kyc';
import type { AuthActionState } from '@/lib/auth';
import {
  KYC_ALLOWED_MIME_TYPES,
  KYC_DOCUMENT_TYPE_OPTIONS,
  KYC_MAX_FILE_SIZE_BYTES,
} from '@/lib/services/kyc-meta';

const INITIAL_STATE: AuthActionState = { success: false };

const INPUT_CLASSES =
  'w-full rounded-lg border px-4 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2';

export function KycUploadForm() {
  const [state, formAction, isPending] = useActionState(
    uploadKycDocumentAction,
    INITIAL_STATE,
  );

  const typeError = state.fieldErrors?.documentType?.[0];
  const fileError = state.fieldErrors?.document?.[0];

  const inputClasses = (hasError: boolean): string =>
    `${INPUT_CLASSES} ${
      hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
        : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-200'
    }`;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.message && !state.success && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </p>
      )}
      {state.success && state.message && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.message}
        </p>
      )}

      {/* نوع الوثيقة */}
      <div>
        <label
          htmlFor="kyc-document-type"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
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
        {typeError && (
          <p className="mt-1.5 text-sm text-red-600">{typeError}</p>
        )}
      </div>

      {/* ملف الوثيقة */}
      <div>
        <label
          htmlFor="kyc-document"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          ملف الوثيقة
        </label>
        <input
          id="kyc-document"
          name="document"
          type="file"
          required
          accept={KYC_ALLOWED_MIME_TYPES.join(',')}
          disabled={isPending}
          className={`${inputClasses(Boolean(fileError))} file:ms-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100`}
        />
        {fileError ? (
          <p className="mt-1.5 text-sm text-red-600">{fileError}</p>
        ) : (
          <p className="mt-1.5 text-xs text-slate-400">
            JPG أو PNG أو WebP أو PDF — حتى{' '}
            {Math.round(KYC_MAX_FILE_SIZE_BYTES / (1024 * 1024))} ميغابايت.
            يُشفَّر الملف (AES-256) قبل تخزينه ولا يطّلع عليه أحد غير فريق
            التوثيق.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'جارٍ الرفع…' : 'رفع الوثيقة'}
      </button>
    </form>
  );
}
