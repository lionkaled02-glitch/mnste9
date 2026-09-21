'use client';

/**
 * ============================================================================
 *  mnste9 — نماذج الإيداع والسحب (مكوّن عميل — تبويب الرصيد)
 * ============================================================================
 *  يظهر النموذج عند ?action=deposit أو ?action=withdraw (روابط تعمل بلا
 *  JavaScript) وتُخفيه عودة «إلغاء».
 *
 *  - نموذج الإيداع: المبلغ (بالدولار) + رقم حوالة الكريمي + اسم المُحوِّل
 *    (اختياري) → حركة pending بانتظار اعتماد الإدارة (لا تعديل أرصدة).
 *  - نموذج السحب: المبلغ فقط → فحص الرصيد المتاح ثم حركة pending.
 *
 *  يعمل عبر useActionState: أخطاء zod لكل حقل + رسائل عامة + isPending.
 * ============================================================================
 */

import Link from 'next/link';
import { useActionState } from 'react';

import {
  requestDepositAction,
  requestWithdrawalAction,
} from '@/app/actions/wallet';
import type { AuthActionState } from '@/lib/auth';

const INITIAL_STATE: AuthActionState = { success: false };

const INPUT_CLASSES =
  'w-full rounded-lg border px-4 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2';

function inputClasses(hasError: boolean): string {
  return `${INPUT_CLASSES} ${
    hasError
      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
      : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-200'
  }`;
}

function FormMessage({ state }: { state: AuthActionState }) {
  if (state.message && !state.success) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {state.message}
      </p>
    );
  }
  if (state.success && state.message) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        {state.message}
      </p>
    );
  }
  return null;
}

/** زر الإرسال المشترك */
function SubmitButton({ isPending, label }: { isPending: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'جارٍ التسجيل…' : label}
      </button>
      <Link
        href="/dashboard/wallet"
        className="text-sm font-semibold text-slate-500 transition hover:text-slate-700"
      >
        إلغاء
      </Link>
    </div>
  );
}

export function DepositForm() {
  const [state, formAction, isPending] = useActionState(
    requestDepositAction,
    INITIAL_STATE,
  );

  const amountError = state.fieldErrors?.amount?.[0];
  const referenceError = state.fieldErrors?.referenceNumber?.[0];
  const senderNameError = state.fieldErrors?.senderName?.[0];

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormMessage state={state} />

      <div className="grid gap-5 sm:grid-cols-2">
        {/* المبلغ — بالدولار (عملة المحفظة) */}
        <div>
          <label htmlFor="deposit-amount" className="mb-2 block text-sm font-medium text-gray-700">
            المبلغ (بالدولار الأمريكي)
          </label>
          <input
            id="deposit-amount"
            name="amount"
            type="number"
            dir="ltr"
            min={1}
            step="0.01"
            required
            disabled={isPending}
            placeholder="100.00"
            className={`${inputClasses(Boolean(amountError))} text-left`}
          />
          {amountError ? (
            <p className="mt-1.5 text-sm text-red-600">{amountError}</p>
          ) : (
            <p className="mt-1.5 text-xs text-slate-400">
              حول المبلغ من حسابك في بنك الكريمي ثم سجّل رقم الحوالة.
            </p>
          )}
        </div>

        {/* رقم حوالة الكريمي */}
        <div>
          <label htmlFor="deposit-reference" className="mb-2 block text-sm font-medium text-gray-700">
            رقم الحوالة
          </label>
          <input
            id="deposit-reference"
            name="referenceNumber"
            type="text"
            dir="ltr"
            required
            maxLength={50}
            disabled={isPending}
            placeholder="MTN-2026-123456"
            className={`${inputClasses(Boolean(referenceError))} text-left`}
          />
          {referenceError ? (
            <p className="mt-1.5 text-sm text-red-600">{referenceError}</p>
          ) : (
            <p className="mt-1.5 text-xs text-slate-400">
              تجده في إشعار الحوالة (SMS) أو كشف الحساب.
            </p>
          )}
        </div>
      </div>

      {/* اسم المُحوِّل — اختياري */}
      <div>
        <label htmlFor="deposit-sender" className="mb-2 block text-sm font-medium text-gray-700">
          اسم المُحوِّل <span className="text-slate-400">(اختياري)</span>
        </label>
        <input
          id="deposit-sender"
          name="senderName"
          type="text"
          maxLength={100}
          disabled={isPending}
          placeholder="الاسم كما في الحوالة"
          className={inputClasses(Boolean(senderNameError))}
        />
        {senderNameError && (
          <p className="mt-1.5 text-sm text-red-600">{senderNameError}</p>
        )}
      </div>

      <SubmitButton isPending={isPending} label="تسجيل طلب الإيداع" />
    </form>
  );
}

export function WithdrawForm() {
  const [state, formAction, isPending] = useActionState(
    requestWithdrawalAction,
    INITIAL_STATE,
  );

  const amountError = state.fieldErrors?.amount?.[0];

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormMessage state={state} />

      <div className="max-w-xs">
        <label htmlFor="withdraw-amount" className="mb-2 block text-sm font-medium text-gray-700">
          المبلغ (بالدولار الأمريكي)
        </label>
        <input
          id="withdraw-amount"
          name="amount"
          type="number"
          dir="ltr"
          min={1}
          step="0.01"
          required
          disabled={isPending}
          placeholder="50.00"
          className={`${inputClasses(Boolean(amountError))} text-left`}
        />
        {amountError ? (
          <p className="mt-1.5 text-sm text-red-600">{amountError}</p>
        ) : (
          <p className="mt-1.5 text-xs text-slate-400">
            يُحوَّل إلى حسابك في بنك الكريمي بعد اعتماد الإدارة.
          </p>
        )}
      </div>

      <SubmitButton isPending={isPending} label="تسجيل طلب السحب" />
    </form>
  );
}
