'use client';

/**
 * ============================================================================
 *  mnste9 — نموذج تقديم عرض (/projects/[id] — للمستقلين)
 * ============================================================================
 *  الحقول: المبلغ ($)، المدة (أيام)، رسالة اختيارية.
 *  يعمل عبر Server Action (submitProposalAction) مع:
 *   - عرض أخطاء zod لكل حقل + رسالة عامة.
 *   - isPending أثناء الإرسال (تعطيل الزر).
 *   - بعد النجاح: رسالة خضراء + router.refresh() كي تعيد الصفحة إظهار
 *     إشعار "قدّمت عرضك بالفعل" بدلاً من النموذج (عرض واحد لكل مستقل).
 * ============================================================================
 */

import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';

import { submitProposalAction } from '@/app/actions/projects';
import type { AuthActionState } from '@/lib/auth';

const INITIAL_STATE: AuthActionState = { success: false };

/** صنف موحّد لحقول الإدخال (نفس نمط صفحات المصادقة) */
const INPUT_CLASSES =
  'w-full rounded-lg border px-4 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2';

export function ProposalForm({ projectId }: { projectId: number }) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    submitProposalAction,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state.success) {
      // تحديث الصفحة من الخادم — يستبدل النموذج بإشعار "قدّمت عرضك بالفعل"
      router.refresh();
    }
  }, [state, router]);

  const amountError = state.fieldErrors?.amount?.[0];
  const durationError = state.fieldErrors?.durationDays?.[0];
  const commentError = state.fieldErrors?.comment?.[0];

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="projectId" value={projectId} />

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

      <div className="grid gap-5 sm:grid-cols-2">
        {/* المبلغ */}
        <div>
          <label
            htmlFor="proposal-amount"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            المبلغ <span className="text-gray-400">(بالدولار $)</span>
          </label>
          <input
            id="proposal-amount"
            name="amount"
            type="number"
            inputMode="decimal"
            min="1"
            step="0.01"
            required
            placeholder="مثال: 250"
            dir="ltr"
            className={`${INPUT_CLASSES} text-left ${
              amountError
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-200'
            }`}
          />
          {amountError && (
            <p className="mt-1.5 text-sm text-red-600">{amountError}</p>
          )}
        </div>

        {/* المدة */}
        <div>
          <label
            htmlFor="proposal-duration"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            مدة التنفيذ <span className="text-gray-400">(بالأيام)</span>
          </label>
          <input
            id="proposal-duration"
            name="durationDays"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            required
            placeholder="مثال: 14"
            dir="ltr"
            className={`${INPUT_CLASSES} text-left ${
              durationError
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-200'
            }`}
          />
          {durationError && (
            <p className="mt-1.5 text-sm text-red-600">{durationError}</p>
          )}
        </div>
      </div>

      {/* الرسالة */}
      <div>
        <label
          htmlFor="proposal-comment"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          رسالتك للعميل{' '}
          <span className="text-gray-400">(اختياري — أبرز خبرتك وخطة العمل)</span>
        </label>
        <textarea
          id="proposal-comment"
          name="comment"
          rows={5}
          maxLength={2000}
          placeholder="عرّف بنفسك، واشرح كيف ستنفّذ المشروع خلال المدة المقترحة…"
          className={`${INPUT_CLASSES} resize-y ${
            commentError
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
              : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-200'
          }`}
        />
        {commentError && (
          <p className="mt-1.5 text-sm text-red-600">{commentError}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-emerald-600 px-8 py-3 font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'جارٍ الإرسال…' : 'تقديم العرض'}
      </button>
    </form>
  );
}
