'use client';

import { useState } from 'react';

import type { PortfolioItemDTO } from '@/app/actions/portfolio';

interface WorkDetailsModalProps {
  item: PortfolioItemDTO;
  onClose: () => void;
}

export function WorkDetailsModal({ item, onClose }: WorkDetailsModalProps) {
  const images = item.images?.length ? item.images : [item.coverImageUrl ?? item.imageUrl].filter((url): url is string => Boolean(url));
  const [index, setIndex] = useState(0);
  const current = images[index];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h2 className="text-lg font-extrabold text-slate-900">{item.title}</h2>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600 hover:bg-slate-200">إغلاق</button>
        </div>

        <div className="p-5">
          {current ? (
            <div className="overflow-hidden rounded-2xl bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current} alt={item.title} className="h-80 w-full object-cover" />
            </div>
          ) : (
            <div className="flex h-80 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">لا توجد صور</div>
          )}

          {images.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {images.map((image, imageIndex) => (
                <button key={image} type="button" onClick={() => setIndex(imageIndex)} className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl ring-2 ${imageIndex === index ? 'ring-[#2386c8]' : 'ring-transparent'}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {item.description && <p className="mt-5 whitespace-pre-line text-sm leading-8 text-slate-600">{item.description}</p>}

          <div className="mt-6 flex flex-wrap gap-3">
            {item.externalUrl && <a href={item.externalUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-[#2386c8] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1a6da8]">فتح الرابط الخارجي</a>}
            {item.attachmentUrl && <a href={item.attachmentUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-[#2386c8]/25 bg-[#2386c8]/5 px-5 py-2.5 text-sm font-bold text-[#2386c8] hover:bg-[#2386c8]/10">تحميل المرفق</a>}
          </div>
        </div>
      </div>
    </div>
  );
}
