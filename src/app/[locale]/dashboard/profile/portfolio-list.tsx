'use client';

import { useActionState } from 'react';
import { deletePortfolioItemSecureAction, type PortfolioItemDTO } from '@/app/actions/portfolio';
import type { AuthActionState } from '@/lib/auth';

const INITIAL: AuthActionState = { success: false };

function DeleteButton({ id }: { id: number }) {
  const [state, formAction, isPending] = useActionState(deletePortfolioItemSecureAction, INITIAL);
  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-7 items-center justify-center rounded-[8px] border border-red-200 bg-white px-3 text-[11px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
      >
        {isPending ? '…' : 'حذف'}
      </button>
      {state.message && !state.success && <span className="ms-2 text-[10px] text-red-600">{state.message}</span>}
    </form>
  );
}

export function PortfolioList({ items }: { items: PortfolioItemDTO[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-[14px] border border-dashed border-gray-300 bg-[#fcfcfc] p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#2386c8]/10 text-[#2386c8]">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        </div>
        <p className="mt-3 text-[13px] font-bold text-[#444]">لا توجد أعمال في معرضك بعد</p>
        <p className="mt-1 text-[11px] text-[#999]">أضف أول عمل لك — سيظهر هنا مع رابط وصورة إن وجدت</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.id} className="group rounded-[12px] border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:border-[#2386c8]/20">
          {item.imageUrl ? (
            <a
              href={item.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="فتح الصورة بالحجم الكامل"
              className="mb-3 block aspect-video overflow-hidden rounded-[10px] bg-[#f4f5f7]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={item.title}
                loading="lazy"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
            </a>
          ) : (
            <div className="mb-3 flex aspect-video items-center justify-center rounded-[10px] border border-dashed border-gray-200 bg-[#fcfcfc] text-[#c4c4c4]">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.3} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
          )}

          <h4 className="text-[13px] font-bold text-[#222] line-clamp-1">{item.title}</h4>
          {item.description ? <p className="mt-1.5 text-[11px] leading-5 text-[#666] line-clamp-3">{item.description}</p> : null}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-1.5">
              {item.externalUrl ? (
                <a href={item.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-7 items-center justify-center rounded-[8px] bg-[#2386c8] px-3 text-[11px] font-bold text-white hover:bg-[#1a6da8]">
                  عرض
                </a>
              ) : null}
              <DeleteButton id={item.id} />
            </div>
            <span className="text-[10px] text-[#999]">{new Date(item.createdAt).toLocaleDateString('ar-EG')}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
