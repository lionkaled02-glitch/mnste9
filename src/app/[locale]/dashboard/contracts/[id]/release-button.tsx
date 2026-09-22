'use client';

/**
 * ============================================================================
 *  mnste9 — زر تحرير الدفعة (مكوّن عميل) — المرحلة 9
 * ============================================================================
 *  يستخدم useActionState مع releasePaymentAction لعرض حالة التحميل
 *  والرسائل، ويعمل حتى مع تعطيل JavaScript عبر Progressive Enhancement
 *  (form action).
 * ============================================================================
 */

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import type { AuthActionState } from '@/lib/auth';
import { releasePaymentAction } from '@/app/actions/contracts';

const initialState: AuthActionState = { success: false };

export function ReleaseButton({ contractId }: { contractId: number }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    releasePaymentAction,
    initialState,
  );

  useEffect(() => {
    if (state.success && state.redirectTo) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="space-y-3">
      <form action={formAction}>
        <input type="hidden" name="contractId" value={contractId} />
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isPending ? 'جاري التحرير…' : 'تحرير الدفعة للمستقل'}
        </button>
      </form>

      {state.message && (
        <p
          className={`rounded-lg border px-4 py-3 text-sm ${
            state.success
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {state.message}
        </p>
      )}

      {state.fieldErrors && Object.keys(state.fieldErrors).length > 0 && (
        <ul className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {Object.entries(state.fieldErrors).map(([field, errors]) =>
            errors.map((error, idx) => (
              <li key={`${field}-${idx}`}>{error}</li>
            )),
          )}
        </ul>
      )}
    </div>
  );
}
