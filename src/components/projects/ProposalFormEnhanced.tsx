'use client';

/**
 * خدمات — نموذج تقديم عرض مع حساب عمولة تلقائي
 * - قيمة العرض، مدة التسليم، شرح العرض
 * - حساب عمولة 15% والمبلغ الصافي
 */

import { useActionState, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitProposalAction } from '@/app/actions/projects';
import type { AuthActionState } from '@/lib/auth';

const INITIAL_STATE: AuthActionState = { success: false };
const COMMISSION_RATE = 0.15;

const INPUT_CLASSES =
  'w-full rounded-[10px] border border-gray-200 bg-[#fcfcfc] px-4 py-2.5 text-[13.5px] text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#2386c8] focus:bg-white focus:ring-2 focus:ring-[#2386c8]/10';

export function ProposalFormEnhanced({ projectId }: { projectId: number }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(submitProposalAction, INITIAL_STATE);
  const [amount, setAmount] = useState<string>('');
  const [duration, setDuration] = useState<string>('');

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state, router]);

  const { commission, net } = useMemo(() => {
    const n = Number.parseFloat(amount || '0');
    if (!Number.isFinite(n) || n <= 0) return { commission: 0, net: 0 };
    const c = n * COMMISSION_RATE;
    return { commission: c, net: n - c };
  }, [amount]);

  const amountError = state.fieldErrors?.amount?.[0];
  const durationError = state.fieldErrors?.durationDays?.[0];
  const commentError = state.fieldErrors?.comment?.[0];

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="projectId" value={projectId} />

      {state.message && !state.success && (
        <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {state.message}
        </div>
      )}
      {state.success && state.message && (
        <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
          {state.message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[12px] font-bold text-[#444]">قيمة عرضك ($)</label>
          <input
            name="amount"
            type="number"
            inputMode="decimal"
            min="1"
            step="0.01"
            required
            placeholder="مثال: 250"
            dir="ltr"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${INPUT_CLASSES} text-left ${amountError ? 'border-red-300 focus:border-red-400' : ''}`}
          />
          {amountError && <p className="mt-1.5 text-[11px] text-red-600">{amountError}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] font-bold text-[#444]">مدة التسليم (أيام)</label>
          <input
            name="durationDays"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            required
            placeholder="مثال: 7"
            dir="ltr"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className={`${INPUT_CLASSES} text-left ${durationError ? 'border-red-300 focus:border-red-400' : ''}`}
          />
          {durationError && <p className="mt-1.5 text-[11px] text-red-600">{durationError}</p>}
        </div>
      </div>

      {/* حساب العمولة التلقائي */}
      <div className="rounded-[10px] border border-gray-200 bg-[#f4f5f7] p-4">
        <h4 className="text-[12px] font-bold text-[#222]">تفاصيل أرباحك</h4>
        <div className="mt-3 space-y-2 text-[12px]">
          <div className="flex justify-between">
            <span className="text-[#666]">قيمة العرض</span>
            <span className="font-bold text-[#222]" dir="ltr">${amount ? Number(amount).toFixed(2) : '0.00'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#666]">عمولة المنصة (15%)</span>
            <span className="font-bold text-[#e74c3c]" dir="ltr">- ${commission.toFixed(2)}</span>
          </div>
          <hr className="border-gray-200" />
          <div className="flex justify-between text-[13px]">
            <span className="font-bold text-[#222]">صافي ربحك</span>
            <span className="font-extrabold text-[#0e9f6e]" dir="ltr">${net.toFixed(2)}</span>
          </div>
          <p className="pt-1 text-[11px] leading-5 text-[#888]">سيتم حجز المبلغ في ضمان خدمات وإطلاقه بعد تسليم العمل وموافقة العميل.</p>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] font-bold text-[#444]">
          شرح العرض <span className="font-normal text-[#888]">(اختياري لكنه يزيد فرص قبولك)</span>
        </label>
        <textarea
          name="comment"
          rows={5}
          maxLength={2000}
          placeholder="اكتب خطة تنفيذك، خبرتك في مشاريع مشابهة، وما سيحصل عليه العميل..."
          className={`${INPUT_CLASSES} resize-y min-h-[120px] ${commentError ? 'border-red-300' : ''}`}
        />
        {commentError && <p className="mt-1.5 text-[11px] text-red-600">{commentError}</p>}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#2386c8] px-6 text-[13.5px] font-bold text-white shadow-sm transition hover:bg-[#1a6da8] disabled:opacity-60 sm:w-auto"
      >
        {isPending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            جارٍ الإرسال...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
            تقديم العرض
          </>
        )}
      </button>

      <p className="text-[11px] leading-5 text-[#888]">
        بتقديمك العرض، أنت توافق على <span className="font-bold text-[#222]">شروط الاستخدام</span> وضمان خدمات. عرض واحد فقط لكل مشروع.
      </p>
    </form>
  );
}
