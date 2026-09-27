'use client';

import { useState } from 'react';

import { deleteReviewAction } from '@/app/actions/admin';

export function DeleteReviewButton({ reviewId }: { reviewId: number }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteReviewAction(reviewId);
    setLoading(false);
    if (result.success) {
      setOpen(false);
      window.location.reload();
      return;
    }
    setMessage(result.message ?? 'تعذر حذف التقييم');
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-800 hover:bg-red-200">
        حذف
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <h2 className="mb-4 text-xl font-bold text-[#1a1a2e]">حذف التقييم؟</h2>
            <p className="mb-4 text-sm text-slate-500">هذا الإجراء لا يمكن التراجع عنه.</p>
            {message && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p>}

            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={loading} className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 font-bold text-white disabled:opacity-60">
                {loading ? 'جارٍ الحذف...' : 'نعم، احذف'}
              </button>
              <button onClick={() => setOpen(false)} disabled={loading} className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 font-bold disabled:opacity-60">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
