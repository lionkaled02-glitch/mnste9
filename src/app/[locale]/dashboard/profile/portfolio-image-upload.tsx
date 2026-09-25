'use client';

/**
 * ============================================================================
 *  خدمات — رفع صورة عمل في معرض الأعمال (Client Component) — #2386c8
 * ============================================================================
 *  - اختيار أو سحب وإفلات، معاينة فورية قبل الإضافة.
 *  - يرفع إلى /api/upload/portfolio ويضع المسار في حقل مخفي imageUrl
 *    يُرسَل مع نموذج «إضافة العمل».
 *  - حقل الملف يحمل الاسم imageFile كمسار بديل بلا JavaScript
 *    (الإجراء الخادمي createPortfolioItem يحفظ الملف بنفسه حينها).
 *  - resetKey: يتغيّر بعد إضافة ناجحة لتصفير المعاينة.
 * ============================================================================
 */

import { useRef } from 'react';

import { CLIENT_UPLOAD_ACCEPT } from '@/lib/upload-client';
import { useImageUpload } from '@/components/upload/use-image-upload';

interface PortfolioImageUploadProps {
  /** يتغيّر بعد إضافة ناجحة → تصفير المعاينة */
  resetKey?: number;
  /** خطأ حقل imageUrl القادم من الخادم (إن وجد) */
  serverError?: string;
  disabled?: boolean;
}

export function PortfolioImageUpload({ resetKey = 0, serverError, disabled }: PortfolioImageUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  // resetKey يتغيّر بعد إضافة ناجحة → الـ hook يصفّر المعاينة أثناء الرندر
  const upload = useImageUpload({ kind: 'portfolio', initialUrl: null, inputRef, resetKey });

  const message = upload.error ?? serverError ?? null;
  const hasImage = Boolean(upload.previewSrc);

  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-bold text-[#444]">
        صورة العمل <span className="font-medium text-[#999]">(اختياري)</span>
      </label>

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && upload.openPicker()}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            upload.openPicker();
          }
        }}
        {...(disabled ? {} : upload.dragHandlers)}
        className={`relative overflow-hidden rounded-[10px] border-2 border-dashed transition focus:outline-none focus:ring-2 focus:ring-[#2386c8]/30 ${
          upload.isDragging
            ? 'border-[#2386c8] bg-[#2386c8]/10'
            : message
              ? 'border-red-300 bg-red-50/40'
              : 'border-gray-300 bg-[#fcfcfc] hover:border-[#2386c8] hover:bg-[#2386c8]/5'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        {hasImage ? (
          <div className="relative aspect-video w-full bg-[#f4f5f7]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={upload.previewSrc ?? undefined}
              alt="معاينة صورة العمل"
              className={`h-full w-full object-cover transition ${upload.isUploading ? 'opacity-60' : ''}`}
            />
            {upload.isUploading && (
              <span className="absolute inset-0 flex items-center justify-center bg-white/40">
                <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#2386c8]/30 border-t-[#2386c8]" aria-label="جارٍ الرفع" />
              </span>
            )}
            {upload.status === 'uploaded' && !upload.isUploading && (
              <span className="absolute bottom-2 start-2 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-white shadow">
                ✓ تم الرفع
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-7 text-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2386c8]/10 text-[#2386c8]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </span>
            <p className="mt-2.5 text-[12px] font-bold text-[#444]">
              {upload.isUploading ? 'جارٍ رفع الصورة…' : 'اسحب صورة العمل هنا أو اضغط للاختيار'}
            </p>
            <p className="mt-1 text-[10.5px] text-[#999]">JPG أو PNG أو WEBP — حتى 5 ميغابايت</p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          name="imageFile"
          accept={CLIENT_UPLOAD_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          disabled={disabled}
          onChange={upload.onInputChange}
          onClick={(event) => event.stopPropagation()}
        />
      </div>

      {/* القيمة التي تُحفظ مع النموذج */}
      <input type="hidden" name="imageUrl" value={upload.value} />

      {message ? (
        <p className="mt-1 text-[11px] text-red-600">{message}</p>
      ) : upload.status === 'uploaded' ? (
        <p className="mt-1 text-[11px] font-medium text-emerald-700">تم رفع الصورة — ستُحفظ مع العمل عند الإضافة.</p>
      ) : null}

      {hasImage && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={upload.openPicker}
            disabled={disabled || upload.isUploading}
            className="inline-flex h-7 items-center justify-center rounded-[8px] border border-[#2386c8]/30 bg-white px-3 text-[11px] font-bold text-[#2386c8] hover:bg-[#2386c8]/10 disabled:opacity-60"
          >
            تغيير الصورة
          </button>
          <button
            type="button"
            onClick={upload.remove}
            disabled={disabled || upload.isUploading}
            className="inline-flex h-7 items-center justify-center rounded-[8px] border border-red-200 bg-white px-3 text-[11px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            إزالة الصورة
          </button>
        </div>
      )}
    </div>
  );
}
