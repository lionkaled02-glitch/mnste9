'use client';

/**
 * ============================================================================
 *  mnste9 — نموذج رفع وثائق الهوية (مكوّن عميل — صفحة التوثيق)
 * ============================================================================
 *  الحقول (مواصفة المرحلة 8 — ثلاث وثائق إلزامية):
 *   - نوع الوثيقة (بطاقة/جواز/رخصة/أخرى).
 *   - صورة الوجه الأمامي + صورة الوجه الخلفي + صورة سيلفي مع الوثيقة.
 *   (JPG أو PNG أو WebP أو PDF حتى 5 ميغابايت لكل ملف.)
 *
 *  يعمل عبر Server Action (uploadKycDocumentsAction) مع useActionState —
 *  الرفع يعمل حتى مع تعطيل JavaScript (نموذج multipart تقليدي)، وكل ملف
 *  يُشفَّر AES-256-GCM في الخادم قبل تخزينه خارج قاعدة البيانات.
 *
 *  القاعدة الذهبية: النموذج يُعرض للمستقلين فقط — الصفحة توجّه غير
 *  المستقلين إلى /dashboard، والإجراء نفسه يفحص الدور أيضاً.
 * ============================================================================
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
  'w-full rounded-lg border px-4 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2';

const FILE_INPUT_CLASSES =
  'w-full rounded-lg border px-4 py-2.5 text-gray-900 outline-none transition focus:ring-2 file:ms-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100';

/** خانات الملفات الثلاث — الاسم في النموذج والوصف */
const FILE_FIELDS = [
  {
    name: 'frontDocument',
    id: 'kyc-front-document',
    label: 'صورة الوثيقة — الوجه الأمامي',
  },
  {
    name: 'backDocument',
    id: 'kyc-back-document',
    label: 'صورة الوثيقة — الوجه الخلفي',
  },
  {
    name: 'selfieDocument',
    id: 'kyc-selfie-document',
    label: 'صورة سيلفي وأنت تحمل الوثيقة',
  },
] as const;

export function KycUploadForm() {
  const [state, formAction, isPending] = useActionState(
    uploadKycDocumentsAction,
    INITIAL_STATE,
  );

  const typeError = state.fieldErrors?.documentType?.[0];

  const inputClasses = (hasError: boolean): string =>
    `${INPUT_CLASSES} ${
      hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
        : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-200'
    }`;

  const fileInputClasses = (hasError: boolean): string =>
    `${FILE_INPUT_CLASSES} ${
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

      {/* الملفات الثلاثة — أمامي / خلفي / سيلفي */}
      <div className="space-y-5">
        {FILE_FIELDS.map((field) => {
          const fileError = state.fieldErrors?.[field.name]?.[0];
          return (
            <div key={field.name}>
              <label
                htmlFor={field.id}
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                {field.label}
              </label>
              <input
                id={field.id}
                name={field.name}
                type="file"
                required
                accept={KYC_ALLOWED_MIME_TYPES.join(',')}
                disabled={isPending}
                className={fileInputClasses(Boolean(fileError))}
              />
              {fileError ? (
                <p className="mt-1.5 text-sm text-red-600">{fileError}</p>
              ) : (
                <p className="mt-1.5 text-xs text-slate-400">
                  JPG أو PNG أو WebP أو PDF — حتى{' '}
                  {Math.round(KYC_MAX_FILE_SIZE_BYTES / (1024 * 1024))}{' '}
                  ميغابايت.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-500">
        تُشفَّر الملفات الثلاثة (AES-256-GCM) قبل تخزينها خارج قاعدة
        البيانات، ولا يطّلع عليها أحد غير فريق التوثيق.
      </p>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'جارٍ رفع الوثائق…' : 'رفع الوثائق'}
      </button>
    </form>
  );
}
