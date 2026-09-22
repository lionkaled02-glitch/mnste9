'use client';

/**
 * ============================================================================
 *  mnste9 — نموذج تغيير كلمة المرور (مكوّن عميل — تبويب الحساب)
 * ============================================================================
 *  الحقول: كلمة المرور الحالية، كلمة المرور الجديدة، تأكيدها.
 *  يعمل عبر Server Action (updatePasswordAction) مع useActionState:
 *   - عرض أخطاء zod لكل حقل (بما فيها عدم تطابق التأكيد) ورسالة عامة
 *     عند خطأ كلمة المرور الحالية.
 *   - isPending أثناء الإرسال (تعطيل الزر والحقول).
 *   - بعد النجاح: يعرض رسالة نجاح وتُفرَّغ الحقول تلقائياً (React 19
 *     يعيد ضبط النماذج غير المحكمة بعد إجراءات الخادم).
 *   - النموذج يعمل حتى مع تعطيل JavaScript (Progressive Enhancement).
 * ============================================================================
 */

import { useActionState } from 'react';

import { updatePasswordAction } from '@/app/actions/profile';
import type { AuthActionState } from '@/lib/auth';

const INITIAL_STATE: AuthActionState = { success: false };

/** صنف موحّد لحقول الإدخال (نفس نمط نماذج المصادقة والمشاريع) */
const INPUT_CLASSES =
  'w-full rounded-lg border px-4 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2';

export function PasswordForm() {
  const [state, formAction, isPending] = useActionState(
    updatePasswordAction,
    INITIAL_STATE,
  );

  const currentError = state.fieldErrors?.currentPassword?.[0];
  const newError = state.fieldErrors?.newPassword?.[0];
  const confirmError = state.fieldErrors?.confirmPassword?.[0];

  const inputClasses = (hasError: boolean): string =>
    `${INPUT_CLASSES} ${
      hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
        : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-200'
    }`;

  return (
    <form action={formAction} className="max-w-xl space-y-5" noValidate>
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

      {/* كلمة المرور الحالية */}
      <div>
        <label
          htmlFor="current-password"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          كلمة المرور الحالية
        </label>
        <input
          id="current-password"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          disabled={isPending}
          className={inputClasses(Boolean(currentError))}
        />
        {currentError && (
          <p className="mt-1.5 text-sm text-red-600">{currentError}</p>
        )}
      </div>

      {/* الجديدة + التأكيد */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="new-password"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            كلمة المرور الجديدة
          </label>
          <input
            id="new-password"
            name="newPassword"
            type="password"
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            disabled={isPending}
            className={inputClasses(Boolean(newError))}
          />
          {newError ? (
            <p className="mt-1.5 text-sm text-red-600">{newError}</p>
          ) : (
            <p className="mt-1.5 text-xs text-slate-400">
              8 أحرف على الأقل.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            تأكيد كلمة المرور الجديدة
          </label>
          <input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            disabled={isPending}
            className={inputClasses(Boolean(confirmError))}
          />
          {confirmError && (
            <p className="mt-1.5 text-sm text-red-600">{confirmError}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'جارٍ التغيير…' : 'تغيير كلمة المرور'}
      </button>
    </form>
  );
}
