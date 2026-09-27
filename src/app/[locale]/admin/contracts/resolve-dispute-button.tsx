'use client';

import { useState } from 'react';

import { resolveDisputeAction } from '@/app/actions/admin';

export function ResolveDisputeButton({ contractId }: { contractId: number }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleResolve = async (resolution: 'client' | 'freelancer' | 'split') => {
    setLoading(true);
    const result = await resolveDisputeAction({ contractId, resolution });
    setLoading(false);
    if (result.success) {
      setOpen(false);
      window.location.reload();
      return;
    }
    setMessage(result.message ?? 'تعذر حل النزاع');
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-800 hover:bg-red-200">
        حل النزاع
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <h2 className="mb-4 text-xl font-bold text-[#1a1a2e]">حل النزاع #{contractId}</h2>
            <p className="mb-4 text-sm text-slate-500">اختر الحل:</p>
            {message && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p>}

            <div className="space-y-3">
              <button onClick={() => handleResolve('client')} disabled={loading} className="w-full rounded-lg bg-blue-100 px-4 py-3 text-right font-bold text-blue-800 hover:bg-blue-200 disabled:opacity-60">
                🔵 لصالح العميل (استرجاع المبلغ)
              </button>
              <button onClick={() => handleResolve('freelancer')} disabled={loading} className="w-full rounded-lg bg-emerald-100 px-4 py-3 text-right font-bold text-emerald-800 hover:bg-emerald-200 disabled:opacity-60">
                🟢 لصالح المستقل (تحرير المبلغ)
              </button>
              <button onClick={() => handleResolve('split')} disabled={loading} className="w-full rounded-lg bg-amber-100 px-4 py-3 text-right font-bold text-amber-800 hover:bg-amber-200 disabled:opacity-60">
                🟡 تقسيم (50% لكل طرف)
              </button>
              <button onClick={() => setOpen(false)} disabled={loading} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 font-bold text-slate-700 disabled:opacity-60">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
