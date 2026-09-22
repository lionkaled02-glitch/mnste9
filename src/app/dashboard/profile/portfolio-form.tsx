'use client';

import { useActionState } from 'react';
import { createPortfolioItemAction } from '@/app/actions/portfolio';
import type { AuthActionState } from '@/lib/auth';

const INITIAL: AuthActionState = { success: false };

export function PortfolioForm() {
  const [state, formAction, isPending] = useActionState(createPortfolioItemAction, INITIAL);

  const titleErr = state.fieldErrors?.title?.[0];
  const descErr = state.fieldErrors?.description?.[0];
  const extErr = state.fieldErrors?.externalUrl?.[0];
  const imgErr = state.fieldErrors?.imageUrl?.[0];

  return (
    <div className="rounded-[14px] border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-[14px] font-bold text-[#222]">إضافة عمل إلى معرض أعمالك</h3>
      <p className="mt-1 text-[11px] text-[#888]">اعرض مشاريعك السابقة لجذب العملاء — الرابط والصورة اختياريان</p>

      {state.message && (
        <div className={`mt-4 rounded-[10px] border px-4 py-3 text-[12px] ${state.success ? 'border-[#2386c8]/20 bg-[#2386c8]/10 text-[#2386c8]' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {state.message}
        </div>
      )}

      <form action={formAction} className="mt-5 space-y-4" noValidate>
        <div>
          <label className="mb-1.5 block text-[12px] font-bold text-[#444]">عنوان العمل *</label>
          <input
            name="title"
            required
            minLength={3}
            maxLength={200}
            placeholder="مثال: تصميم متجر إلكتروني"
            className={`w-full rounded-[10px] border px-3.5 py-2.5 text-[13px] outline-none focus:ring-2 ${titleErr ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-[#2386c8] focus:ring-[#2386c8]/20'}`}
          />
          {titleErr && <p className="mt-1 text-[11px] text-red-600">{titleErr}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] font-bold text-[#444]">الوصف</label>
          <textarea
            name="description"
            rows={3}
            maxLength={1000}
            placeholder="اشرح بإيجاز ما أنجزته والتقنيات المستخدمة…"
            className={`w-full resize-y rounded-[10px] border px-3.5 py-2.5 text-[13px] outline-none focus:ring-2 ${descErr ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-[#2386c8] focus:ring-[#2386c8]/20'}`}
          />
          {descErr && <p className="mt-1 text-[11px] text-red-600">{descErr}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-[#444]">رابط خارجي</label>
            <input
              name="externalUrl"
              type="url"
              dir="ltr"
              maxLength={500}
              placeholder="https://example.com"
              className={`w-full rounded-[10px] border px-3.5 py-2.5 text-left text-[13px] outline-none focus:ring-2 ${extErr ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-[#2386c8] focus:ring-[#2386c8]/20'}`}
            />
            {extErr && <p className="mt-1 text-[11px] text-red-600">{extErr}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-[#444]">رابط صورة</label>
            <input
              name="imageUrl"
              type="url"
              dir="ltr"
              maxLength={500}
              placeholder="https://example.com/image.jpg"
              className={`w-full rounded-[10px] border px-3.5 py-2.5 text-left text-[13px] outline-none focus:ring-2 ${imgErr ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-[#2386c8] focus:ring-[#2386c8]/20'}`}
            />
            {imgErr && <p className="mt-1 text-[11px] text-red-600">{imgErr}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[#2386c8] px-6 text-[13px] font-bold text-white hover:bg-[#1a6da8] disabled:opacity-60"
        >
          {isPending ? 'جارٍ الإضافة…' : '+ إضافة العمل'}
        </button>
      </form>
    </div>
  );
}
