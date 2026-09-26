'use client';

import { useState } from 'react';

interface KycImage {
  src: string;
  label: string;
}

interface Props {
  images: KycImage[];
}

export function KycImageModal({ images }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return <p className="text-sm text-slate-500">لا توجد صور مرفوعة.</p>;
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        {images.map((image, index) => (
          <button
            key={`${image.label}-${index}`}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="group block overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-start transition hover:border-[#2386c8] hover:shadow-lg"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.label}
              className="h-40 w-full object-cover transition group-hover:scale-105"
            />
            <div className="bg-white p-3 text-sm font-bold text-slate-700">
              {image.label}
            </div>
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpenIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-bold text-black hover:bg-slate-200"
            aria-label="إغلاق"
          >
            ✕
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[openIndex].src}
            alt={images[openIndex].label}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />

          <p className="absolute right-4 top-4 rounded-lg bg-white/90 px-4 py-2 text-sm font-bold text-black">
            {images[openIndex].label}
          </p>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenIndex((openIndex - 1 + images.length) % images.length);
                }}
                className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-2xl font-bold text-black hover:bg-slate-200"
                aria-label="السابق"
              >
                ›
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenIndex((openIndex + 1) % images.length);
                }}
                className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-2xl font-bold text-black hover:bg-slate-200"
                aria-label="التالي"
              >
                ‹
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
