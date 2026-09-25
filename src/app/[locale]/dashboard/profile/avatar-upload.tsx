'use client';

/**
 * ============================================================================
 *  خدمات — رفع الصورة الشخصية (Client Component) — #2386c8
 * ============================================================================
 *  - اختيار من الجهاز أو سحب وإفلات، معاينة فورية قبل الحفظ.
 *  - يرفع إلى /api/upload/avatar ويضع المسار في حقل مخفي avatarUrl
 *    يُرسَل مع نموذج الملف الشخصي عند «حفظ التغييرات».
 *  - حقل الملف يحمل الاسم avatarFile كمسار بديل بلا JavaScript
 *    (الإجراء الخادمي updateProfile يحفظ الملف بنفسه حينها).
 *  - زر حذف الصورة الحالية + تراجع.
 * ============================================================================
 */

import { useRef } from 'react';

import { CLIENT_UPLOAD_ACCEPT } from '@/lib/upload-client';
import { useImageUpload } from '@/components/upload/use-image-upload';

interface AvatarUploadProps {
  /** الصورة المحفوظة حالياً في قاعدة البيانات */
  initialUrl: string | null;
  /** اسم المستخدم — لعرض الحرف الأول عند غياب الصورة */
  displayName: string;
  /** خطأ حقل avatarUrl القادم من الخادم (إن وجد) */
  serverError?: string;
  disabled?: boolean;
}

export function AvatarUpload({ initialUrl, displayName, serverError, disabled }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const upload = useImageUpload({ kind: 'avatar', initialUrl, inputRef });

  const initial = displayName.trim().charAt(0) || 'م';
  const hasImage = Boolean(upload.previewSrc);
  const message = upload.error ?? serverError ?? null;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-6">
      {/* المعاينة */}
      <div className="relative shrink-0">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={upload.previewSrc ?? undefined}
            alt={displayName}
            className={`h-28 w-28 rounded-full object-cover shadow-inner ring-4 ring-[#2386c8]/10 transition ${upload.isUploading ? 'opacity-60' : ''}`}
          />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#e0f2fe] to-[#2386c8]/20 text-4xl font-bold text-[#2386c8] shadow-inner ring-4 ring-[#2386c8]/10">
            {initial}
          </div>
        )}

        {upload.isUploading && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/50">
            <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#2386c8]/30 border-t-[#2386c8]" aria-label="جارٍ الرفع" />
          </span>
        )}

        {upload.status === 'uploaded' && !upload.isUploading && (
          <span className="absolute -bottom-1 -left-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow ring-2 ring-white" title="تم الرفع — اضغط حفظ التغييرات">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75 7.5 15 15 9.75" />
            </svg>
          </span>
        )}
      </div>

      {/* منطقة الرفع */}
      <div className="w-full min-w-0 flex-1">
        <span className="mb-2 block text-sm font-medium text-gray-700">
          الصورة الشخصية <span className="text-slate-400">(اختياري)</span>
        </span>

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
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition focus:outline-none focus:ring-2 focus:ring-[#2386c8]/30 ${
            upload.isDragging
              ? 'border-[#2386c8] bg-[#2386c8]/10'
              : message
                ? 'border-red-300 bg-red-50/40 hover:border-red-400'
                : 'border-gray-300 bg-slate-50 hover:border-[#2386c8] hover:bg-[#2386c8]/5'
          } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2386c8]/10 text-[#2386c8]">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
          </span>
          <p className="mt-3 text-sm font-semibold text-slate-700">
            {upload.isUploading ? 'جارٍ رفع الصورة…' : 'اسحب الصورة هنا أو اضغط للاختيار'}
          </p>
          <p className="mt-1 text-xs text-slate-400">JPG أو PNG أو WEBP — حتى 5 ميغابايت</p>

          <input
            ref={inputRef}
            type="file"
            name="avatarFile"
            accept={CLIENT_UPLOAD_ACCEPT}
            className="sr-only"
            tabIndex={-1}
            disabled={disabled}
            onChange={upload.onInputChange}
            onClick={(event) => event.stopPropagation()}
          />
        </div>

        {/* القيمة التي تُحفظ مع النموذج */}
        <input type="hidden" name="avatarUrl" value={upload.value} />

        {/* الرسائل */}
        {message ? (
          <p className="mt-2 text-sm text-red-600">{message}</p>
        ) : upload.status === 'uploaded' ? (
          <p className="mt-2 text-xs font-medium text-emerald-700">تم رفع الصورة — اضغط «حفظ التغييرات» لتثبيتها.</p>
        ) : upload.isDirty && upload.value === '' && upload.hasSaved ? (
          <p className="mt-2 text-xs font-medium text-amber-700">ستُحذف الصورة الحالية عند حفظ التغييرات.</p>
        ) : (
          <p className="mt-2 text-xs text-slate-400">تظهر صورتك في ملفك العام وبجانب عروضك ورسائلك.</p>
        )}

        {/* الأزرار */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={upload.openPicker}
            disabled={disabled || upload.isUploading}
            className="rounded-lg border border-[#2386c8]/30 bg-white px-4 py-2 text-xs font-semibold text-[#2386c8] transition hover:bg-[#2386c8]/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {hasImage ? 'تغيير الصورة' : 'اختيار صورة'}
          </button>

          {hasImage && (
            <button
              type="button"
              onClick={upload.remove}
              disabled={disabled || upload.isUploading}
              className="rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              حذف الصورة
            </button>
          )}

          {upload.isDirty && (
            <button
              type="button"
              onClick={upload.restore}
              disabled={disabled || upload.isUploading}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              تراجع
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
