'use client';

import { useState } from 'react';

interface ConfirmModalProps {
  title: string;
  description: string;
  confirmLabel?: string;
}

export function ConfirmModal({ title, description, confirmLabel = 'تأكيد' }: ConfirmModalProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100">{confirmLabel}</button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-extrabold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">إلغاء</button>
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white">تأكيد</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
