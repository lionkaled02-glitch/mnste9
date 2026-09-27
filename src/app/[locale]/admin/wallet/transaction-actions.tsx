'use client';

import { useState, useTransition } from 'react';

import {
  approveDepositAction,
  approveWithdrawalAction,
  rejectDepositAction,
  rejectWithdrawalAction,
} from '@/app/actions/admin';

type TransactionActionType = 'deposit' | 'withdrawal' | string;

interface TransactionActionsProps {
  transactionId: number;
  type: TransactionActionType;
  status: string;
}

export function TransactionActions({ transactionId, type, status }: TransactionActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  if (status !== 'pending' || (type !== 'deposit' && type !== 'withdrawal')) {
    return <span className="text-xs font-bold text-slate-400">—</span>;
  }

  const label = type === 'deposit' ? 'الإيداع' : 'السحب';

  const approve = () => {
    setMessage('');
    startTransition(async () => {
      const result = type === 'deposit' ? await approveDepositAction(transactionId) : await approveWithdrawalAction(transactionId);
      if (result.success) window.location.reload();
      else setMessage(result.message ?? 'تعذّر تنفيذ العملية');
    });
  };

  const reject = () => {
    setMessage('');
    startTransition(async () => {
      const result = type === 'deposit' ? await rejectDepositAction(transactionId, reason) : await rejectWithdrawalAction(transactionId, reason);
      if (result.success) window.location.reload();
      else setMessage(result.message ?? 'تعذّر تنفيذ العملية');
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={approve}
        disabled={isPending}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-extrabold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        موافقة
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-extrabold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        رفض
      </button>
      {message ? <span className="basis-full text-xs font-bold text-red-600">{message}</span> : null}

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-right shadow-2xl" dir="rtl">
            <h2 className="text-lg font-extrabold text-[#1a1a2e]">رفض {label}</h2>
            <p className="mt-2 text-sm text-slate-500">اكتب سبب الرفض ليظهر للمستخدم في الإشعار.</p>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="سبب الرفض"
              className="mt-4 min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-[#2386c8] focus:ring-2 focus:ring-[#2386c8]/20"
            />
            {message ? <p className="mt-3 text-sm font-bold text-red-600">{message}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={reject}
                disabled={isPending}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
