'use client';

/**
 * خدمات — نماذج الإيداع والسحب — إعادة تصميم #2386c8
 */

import { Link } from '@/i18n/navigation';
import { useActionState, useState } from 'react';

import { requestDepositAction, requestWithdrawalAction } from '@/app/actions/wallet';
import type { AuthActionState } from '@/lib/auth';

const INITIAL_STATE: AuthActionState = { success: false };

const INPUT_CLASSES =
  'w-full rounded-[10px] border px-4 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2';

function inputClasses(hasError: boolean): string {
  return `${INPUT_CLASSES} ${
    hasError
      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
      : 'border-gray-300 focus:border-[#2386c8] focus:ring-[#2386c8]/20'
  }`;
}

function FormMessage({ state }: { state: AuthActionState }) {
  if (state.message && !state.success) {
    return (
      <p className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
        {state.message}
      </p>
    );
  }
  if (state.success && state.message) {
    return (
      <p className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] text-emerald-700">
        {state.message}
      </p>
    );
  }
  return null;
}

function SubmitButton({ isPending, label }: { isPending: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="submit"
        disabled={isPending}
        className="rounded-[10px] bg-[#2386c8] px-8 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#1a6da8] focus:outline-none focus:ring-2 focus:ring-[#2386c8]/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'جارٍ التسجيل…' : label}
      </button>
      <Link
        href="/dashboard/wallet"
        className="text-[13px] font-bold text-[#666] transition hover:text-[#222]"
      >
        إلغاء
      </Link>
    </div>
  );
}

function Label({ htmlFor, children, optional }: { htmlFor: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-[12px] font-bold text-[#444]">
      {children} {optional && <span className="font-medium text-[#999]">(اختياري)</span>}
    </label>
  );
}

export function DepositForm() {
  const [state, formAction, isPending] = useActionState(requestDepositAction, INITIAL_STATE);
  const [method, setMethod] = useState<'kuraimi' | 'paypal'>('kuraimi');

  const amountError = state.fieldErrors?.amount?.[0];
  const referenceError = state.fieldErrors?.referenceNumber?.[0];
  const methodError = state.fieldErrors?.paymentMethod?.[0];
  const senderNameError = state.fieldErrors?.senderName?.[0];

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormMessage state={state} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="deposit-amount">المبلغ (USD)</Label>
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
            <p className="mt-1.5 text-[11px] text-red-600">{amountError}</p>
          ) : (
            <p className="mt-1.5 text-[11px] text-[#999]">سيُقيَّد بعد اعتماد الإدارة — الحالة pending</p>
          )}
        </div>

        <div>
          <Label htmlFor="deposit-method">طريقة الإيداع</Label>
          <select
            id="deposit-method"
            name="paymentMethod"
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
            disabled={isPending}
            className={`${inputClasses(Boolean(methodError))} bg-white`}
          >
            <option value="kuraimi">بنك الكريمي — محلي</option>
            <option value="paypal">PayPal — دولي</option>
          </select>
          {methodError && <p className="mt-1.5 text-[11px] text-red-600">{methodError}</p>}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="deposit-reference">رقم الحوالة / المرجع</Label>
          <input
            id="deposit-reference"
            name="referenceNumber"
            type="text"
            dir="ltr"
            required
            maxLength={50}
            disabled={isPending}
            placeholder={method === 'kuraimi' ? 'MTN-2026-123456' : 'PAYPAL-TXN-123'}
            className={`${inputClasses(Boolean(referenceError))} text-left`}
          />
          {referenceError ? (
            <p className="mt-1.5 text-[11px] text-red-600">{referenceError}</p>
          ) : (
            <p className="mt-1.5 text-[11px] text-[#999]">
              {method === 'kuraimi' ? 'تجده في إشعار الحوالة SMS' : 'رقم العملية في PayPal'}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="deposit-sender" optional>اسم المُحوِّل</Label>
          <input
            id="deposit-sender"
            name="senderName"
            type="text"
            maxLength={100}
            disabled={isPending}
            placeholder="الاسم كما في الحوالة"
            className={inputClasses(Boolean(senderNameError))}
          />
          {senderNameError && <p className="mt-1.5 text-[11px] text-red-600">{senderNameError}</p>}
        </div>
      </div>

      <SubmitButton isPending={isPending} label="تسجيل طلب الإيداع" />
    </form>
  );
}

export function WithdrawForm() {
  const [state, formAction, isPending] = useActionState(requestWithdrawalAction, INITIAL_STATE);
  const [method, setMethod] = useState<'kuraimi' | 'paypal' | 'bank_transfer'>('kuraimi');

  const amountError = state.fieldErrors?.amount?.[0];
  const methodError = state.fieldErrors?.paymentMethod?.[0];
  const accountNumberError = state.fieldErrors?.accountNumber?.[0];
  const accountHolderError = state.fieldErrors?.accountHolderName?.[0];
  const paypalEmailError = state.fieldErrors?.paypalEmail?.[0];

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormMessage state={state} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="withdraw-amount">المبلغ (USD)</Label>
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
            <p className="mt-1.5 text-[11px] text-red-600">{amountError}</p>
          ) : (
            <p className="mt-1.5 text-[11px] text-[#999]">الحالة pending حتى يعتمدها المشرف — 24-48 ساعة</p>
          )}
        </div>

        <div>
          <Label htmlFor="withdraw-method">وسيلة السحب</Label>
          <select
            id="withdraw-method"
            name="paymentMethod"
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
            disabled={isPending}
            className={`${inputClasses(Boolean(methodError))} bg-white`}
          >
            <option value="kuraimi">بنك الكريمي — محلي</option>
            <option value="paypal">PayPal — دولي</option>
            <option value="bank_transfer">تحويل بنكي</option>
          </select>
          {methodError && <p className="mt-1.5 text-[11px] text-red-600">{methodError}</p>}
        </div>
      </div>

      {method === 'kuraimi' || method === 'bank_transfer' ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="withdraw-account-number">رقم الحساب</Label>
            <input
              id="withdraw-account-number"
              name="accountNumber"
              type="text"
              dir="ltr"
              required
              maxLength={50}
              disabled={isPending}
              placeholder="123456789"
              className={`${inputClasses(Boolean(accountNumberError))} text-left`}
            />
            {accountNumberError && <p className="mt-1.5 text-[11px] text-red-600">{accountNumberError}</p>}
          </div>

          <div>
            <Label htmlFor="withdraw-holder">اسم صاحب الحساب</Label>
            <input
              id="withdraw-holder"
              name="accountHolderName"
              type="text"
              maxLength={100}
              required
              disabled={isPending}
              placeholder="الاسم كما في البنك"
              className={inputClasses(Boolean(accountHolderError))}
            />
            {accountHolderError && <p className="mt-1.5 text-[11px] text-red-600">{accountHolderError}</p>}
          </div>
        </div>
      ) : (
        <div>
          <Label htmlFor="withdraw-paypal">بريد PayPal</Label>
          <input
            id="withdraw-paypal"
            name="paypalEmail"
            type="email"
            dir="ltr"
            required
            maxLength={255}
            disabled={isPending}
            placeholder="you@paypal.com"
            className={`${inputClasses(Boolean(paypalEmailError))} text-left`}
          />
          {paypalEmailError && <p className="mt-1.5 text-[11px] text-red-600">{paypalEmailError}</p>}
        </div>
      )}

      <div className="rounded-[10px] bg-[#f4f5f7] border border-gray-200 p-3 text-[11px] leading-5 text-[#666]">
        💡 اختر الكريمي للسحب المحلي بدون عمولة • PayPal عمولة 2% • بنكي حسب البنك المستقبل
      </div>

      <SubmitButton isPending={isPending} label="طلب سحب الأرباح" />
    </form>
  );
}
