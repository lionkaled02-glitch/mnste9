'use client';

/**
 * ============================================================================
 *  خدمات — Hook مشترك لرفع الصور مع معاينة (الصورة الشخصية / معرض الأعمال)
 * ============================================================================
 *  دورة الحياة:
 *   1) اختيار/إفلات ملف → تحقق فوري (الصيغة/الحجم) → معاينة محلية فورية.
 *   2) رفع إلى /api/upload/<kind> → المسار المعاد يصبح قيمة الحقل المخفي
 *      (avatarUrl / imageUrl) الذي يُرسَل مع النموذج عند «الحفظ».
 *   3) «حذف» يمسح القيمة (يُحذف الملف غير المحفوظ فوراً، والمحفوظ عند الحفظ
 *      من داخل الإجراء الخادمي). «تراجع» يعيد القيمة المحفوظة.
 *   4) عند تغيّر initialUrl (بعد حفظ ناجح) أو resetKey (بعد إضافة ناجحة)
 *      تتم مزامنة الحالة أثناء الرندر (نمط «تعديل الحالة عند تغيّر prop»
 *      الموصى به في React — بلا effects).
 * ============================================================================
 */

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent, type RefObject } from 'react';

import {
  deleteUploadedImage,
  uploadImage,
  validateImageFile,
  type ClientUploadKind,
} from '@/lib/upload-client';

export type ImageUploadStatus = 'idle' | 'uploading' | 'uploaded' | 'error';

interface UseImageUploadOptions {
  /** نوع الرفع — يحدد نقطة النهاية /api/upload/<kind> */
  kind: ClientUploadKind;
  /** القيمة المحفوظة حالياً في قاعدة البيانات (null = بلا صورة) */
  initialUrl?: string | null;
  /** مرجع حقل الملف المخفي — يملكه المكوّن ويمرَّر إلى <input ref> */
  inputRef: RefObject<HTMLInputElement | null>;
  /** يتغيّر بعد حفظ ناجح لتصفير المعاينة (الملف المرفوع أصبح محفوظاً) */
  resetKey?: number;
}

export function useImageUpload({ kind, initialUrl = null, inputRef, resetKey = 0 }: UseImageUploadOptions) {
  const savedValue = initialUrl ?? '';

  const [value, setValue] = useState<string>(savedValue);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<ImageUploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  /** تسلسل الطلبات لتجاهل نتائج رفع قديمة إن اختار المستخدم ملفاً آخر بسرعة */
  const requestSeq = useRef(0);

  // مزامنة أثناء الرندر مع القيمة المحفوظة/مفتاح التصفير القادمين من الخادم
  const syncKey = `${savedValue}\u0000${resetKey}`;
  const [appliedSyncKey, setAppliedSyncKey] = useState(syncKey);
  if (appliedSyncKey !== syncKey) {
    setAppliedSyncKey(syncKey);
    setValue(savedValue);
    setPendingUrl(null);
    setLocalPreview(null);
    setStatus('idle');
    setError(null);
  }

  // تحرير معاينة ObjectURL القديمة عند تغيّرها أو عند الإزالة
  useEffect(() => {
    if (!localPreview) return;
    return () => URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  const handleFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;

      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        setStatus('error');
        return;
      }

      const seq = ++requestSeq.current;
      setLocalPreview(URL.createObjectURL(file));
      setStatus('uploading');
      setError(null);

      // pendingUrl هنا هو آخر رفع مؤكد غير محفوظ — يُحذف خادمياً بعد نجاح الجديد
      const result = await uploadImage(kind, file, pendingUrl);

      // طلب قديم — المستخدم اختار ملفاً آخر أثناء الرفع: ننظّف ونتجاهل
      if (seq !== requestSeq.current) {
        if (result.ok) void deleteUploadedImage(kind, result.url);
        return;
      }

      if (result.ok) {
        setValue(result.url);
        setPendingUrl(result.url);
        setStatus('uploaded');
      } else {
        setLocalPreview(null);
        setStatus('error');
        setError(result.error);
      }
    },
    [kind, pendingUrl],
  );

  /** إلغاء أي رفع جارٍ وحذف الرفع غير المحفوظ (إن وجد) */
  const discardPending = useCallback(() => {
    requestSeq.current += 1;
    if (pendingUrl) {
      setPendingUrl(null);
      void deleteUploadedImage(kind, pendingUrl);
    }
  }, [kind, pendingUrl]);

  /** حذف الصورة الحالية — تُحفظ الإزالة عند إرسال النموذج */
  const remove = useCallback(() => {
    discardPending();
    setValue('');
    setLocalPreview(null);
    setStatus('idle');
    setError(null);
  }, [discardPending]);

  /** التراجع إلى الصورة المحفوظة */
  const restore = useCallback(() => {
    discardPending();
    setValue(savedValue);
    setLocalPreview(null);
    setStatus('idle');
    setError(null);
  }, [discardPending, savedValue]);

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, [inputRef]);

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      // نفرّغ الحقل كي لا يُرسَل الملف مرة ثانية مع النموذج (المسار المرفوع يكفي)
      event.target.value = '';
      void handleFile(file);
    },
    [handleFile],
  );

  const dragHandlers = {
    onDragOver: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      if (!isDragging) setIsDragging(true);
    },
    onDragLeave: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      setIsDragging(false);
    },
    onDrop: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      setIsDragging(false);
      void handleFile(event.dataTransfer?.files?.[0]);
    },
  };

  return {
    /** القيمة التي تُرسَل مع النموذج ('' = بلا صورة) */
    value,
    /** مصدر المعاينة: الملف المحلي أثناء/بعد الرفع، وإلا القيمة الحالية */
    previewSrc: localPreview ?? (value || null),
    status,
    error,
    isDragging,
    isUploading: status === 'uploading',
    /** هل تختلف القيمة الحالية عن المحفوظة؟ */
    isDirty: value !== savedValue,
    hasSaved: savedValue !== '',
    hasPending: pendingUrl !== null,
    openPicker,
    onInputChange,
    handleFile,
    remove,
    restore,
    dragHandlers,
  };
}
