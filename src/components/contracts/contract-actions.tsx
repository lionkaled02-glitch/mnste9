'use client';

import { useActionState, useState } from 'react';
import {
  submitDeliveryAction,
  requestRevisionAction,
  raiseDisputeAction,
  releasePaymentAction,
} from '@/app/actions/contracts';
import type { AuthActionState } from '@/lib/auth';

const INITIAL: AuthActionState = { success: false };

function Message({ state }: { state: AuthActionState }) {
  if (!state.message) return null;
  return (
    <p className={`mt-3 rounded-[10px] border px-3 py-2 text-[11px] ${state.success ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
      {state.message}
    </p>
  );
}

export function ReleasePaymentCard({ contractId, netAmount, freelancerName }: { contractId: number; netAmount: string; freelancerName: string }) {
  const [state, formAction, isPending] = useActionState(releasePaymentAction, INITIAL);

  return (
    <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-5">
      <h3 className="text-[13px] font-bold text-amber-900">قبول التسليم وتحرير المبلغ</h3>
      <p className="mt-2 text-[12px] leading-6 text-amber-800">
        سيُحوَّل الصافي <b dir="ltr">{netAmount} $</b> إلى محفظة <b>{freelancerName}</b>. لا يمكن التراجع بعد التحرير.
      </p>
      <form action={formAction} className="mt-4">
        <input type="hidden" name="contractId" value={contractId} />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[#2386c8] px-6 text-[12px] font-bold text-white hover:bg-[#1a6da8] disabled:opacity-60"
        >
          {isPending ? 'جاري التحرير…' : 'قبول وتحرير المبلغ ✓'}
        </button>
      </form>
      <Message state={state} />
    </div>
  );
}

export function DeliveryForm({ contractId }: { contractId: number }) {
  const [state, formAction, isPending] = useActionState(submitDeliveryAction, INITIAL);
  const [notes, setNotes] = useState('');
  const [links, setLinks] = useState('');

  return (
    <div className="rounded-[12px] border border-[#2386c8]/20 bg-[#2386c8]/[0.04] p-5">
      <h3 className="text-[13px] font-bold text-[#222]">تسليم المشروع</h3>
      <p className="mt-1 text-[11px] text-[#666]">أدخل ملاحظات التسليم والروابط — سيتم إشعار العميل فوراً</p>

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="contractId" value={contractId} />
        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-[#444]">ملاحظات التسليم</label>
          <textarea
            name="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            required
            minLength={10}
            rows={4}
            placeholder="اكتب ما تم إنجازه، كيفية الاستخدام، ملفات مرفقة..."
            className="w-full rounded-[10px] border border-gray-300 bg-white px-3 py-2.5 text-[12px] text-[#222] outline-none focus:border-[#2386c8] focus:ring-2 focus:ring-[#2386c8]/15"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-[#444]">روابط العمل (اختياري)</label>
          <input
            name="links"
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            placeholder="https://drive.google.com/... , https://github.com/..."
            className="w-full rounded-[10px] border border-gray-300 bg-white px-3 py-2.5 text-[12px] text-[#222] outline-none focus:border-[#2386c8] focus:ring-2 focus:ring-[#2386c8]/15"
            dir="ltr"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[#2386c8] px-6 text-[12px] font-bold text-white hover:bg-[#1a6da8] disabled:opacity-60"
        >
          {isPending ? 'جاري التسليم…' : 'تسليم المشروع 📦'}
        </button>
      </form>
      <Message state={state} />
    </div>
  );
}

export function RevisionForm({ contractId }: { contractId: number }) {
  const [state, formAction, isPending] = useActionState(requestRevisionAction, INITIAL);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex h-10 items-center justify-center rounded-[10px] border border-gray-200 bg-white px-5 text-[12px] font-bold text-[#444] hover:border-[#2386c8] hover:text-[#2386c8]">
        طلب تعديلات
      </button>
    );
  }

  return (
    <div className="rounded-[12px] border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-[13px] font-bold text-[#222]">طلب تعديلات</h3>
      <form action={formAction} className="mt-3 space-y-3">
        <input type="hidden" name="contractId" value={contractId} />
        <textarea
          name="reason"
          required
          minLength={10}
          rows={3}
          placeholder="اكتب ما تريد تعديله بوضوح..."
          className="w-full rounded-[10px] border border-gray-300 bg-white px-3 py-2.5 text-[12px] text-[#222] outline-none focus:border-[#2386c8] focus:ring-2 focus:ring-[#2386c8]/15"
        />
        <div className="flex gap-2">
          <button type="submit" disabled={isPending} className="inline-flex h-9 items-center justify-center rounded-[8px] bg-[#222] px-4 text-[11px] font-bold text-white hover:bg-black disabled:opacity-60">
            {isPending ? 'جاري الإرسال…' : 'إرسال الطلب'}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="inline-flex h-9 items-center justify-center rounded-[8px] border border-gray-200 bg-white px-4 text-[11px] font-bold text-[#666] hover:text-[#222]">
            إلغاء
          </button>
        </div>
      </form>
      <Message state={state} />
    </div>
  );
}

export function DisputeForm({ contractId }: { contractId: number }) {
  const [state, formAction, isPending] = useActionState(raiseDisputeAction, INITIAL);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex h-10 items-center justify-center rounded-[10px] border border-red-200 bg-red-50 px-5 text-[12px] font-bold text-red-700 hover:bg-red-100">
        فتح نزاع / طلب التدخل ⚠️
      </button>
    );
  }

  return (
    <div className="rounded-[12px] border border-red-200 bg-red-50 p-5">
      <h3 className="text-[13px] font-bold text-red-900">فتح نزاع</h3>
      <p className="mt-1 text-[11px] text-red-700">سيتدخل فريق الدعم لمراجعة العقد وحل المشكلة</p>
      <form action={formAction} className="mt-3 space-y-3">
        <input type="hidden" name="contractId" value={contractId} />
        <textarea
          name="reason"
          required
          minLength={10}
          rows={3}
          placeholder="اشرح المشكلة بالتفصيل..."
          className="w-full rounded-[10px] border border-red-200 bg-white px-3 py-2.5 text-[12px] text-[#222] outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
        />
        <div className="flex gap-2">
          <button type="submit" disabled={isPending} className="inline-flex h-9 items-center justify-center rounded-[8px] bg-red-600 px-4 text-[11px] font-bold text-white hover:bg-red-700 disabled:opacity-60">
            {isPending ? 'جاري الفتح…' : 'تأكيد فتح النزاع'}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="inline-flex h-9 items-center justify-center rounded-[8px] border border-gray-200 bg-white px-4 text-[11px] font-bold text-[#666] hover:text-[#222]">
            إلغاء
          </button>
        </div>
      </form>
      <Message state={state} />
    </div>
  );
}
