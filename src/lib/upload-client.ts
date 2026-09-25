/**
 * ============================================================================
 *  خدمات — أدوات رفع الصور من جهة العميل (آمنة للاستيراد في 'use client')
 * ============================================================================
 *  - نفس حدود الخادم (5MB — JPG/PNG/WEBP) لعرض رسائل فورية قبل الرفع.
 *  - uploadImage(): يرسل الملف إلى /api/upload/<kind> ويعيد المسار المحفوظ.
 *  - deleteUploadedImage(): يحذف ملفاً رُفع ولم يُحفظ بعد (تنظيف).
 *  لا تستورد هنا أي شيء من node: — الملف يُحزَّم للمتصفح.
 * ============================================================================
 */

export const CLIENT_UPLOAD_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const CLIENT_UPLOAD_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** قيمة accept لحقل الملف */
export const CLIENT_UPLOAD_ACCEPT = CLIENT_UPLOAD_ALLOWED_MIME_TYPES.join(',');

export type ClientUploadKind = 'avatar' | 'portfolio';

/** تحقق فوري في المتصفح — يعيد رسالة خطأ عربية أو null إن كان الملف صالحاً */
export function validateImageFile(file: File): string | null {
  if (!(CLIENT_UPLOAD_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return 'صيغة غير مدعومة — المسموح: JPG أو PNG أو WEBP';
  }
  if (file.size > CLIENT_UPLOAD_MAX_FILE_SIZE_BYTES) {
    return 'حجم الصورة كبير جداً — الحد الأقصى 5 ميغابايت';
  }
  return null;
}

/** تنسيق حجم الملف للعرض */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type UploadImageResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * رفع صورة إلى /api/upload/<kind>.
 * @param replaceUrl مسار رفع سابق لم يُحفظ بعد — يحذفه الخادم بعد نجاح الرفع الجديد.
 */
export async function uploadImage(
  kind: ClientUploadKind,
  file: File,
  replaceUrl?: string | null,
): Promise<UploadImageResult> {
  const body = new FormData();
  body.append('file', file);
  if (replaceUrl) body.append('replace', replaceUrl);

  try {
    const response = await fetch(`/api/upload/${kind}`, {
      method: 'POST',
      body,
      credentials: 'same-origin',
    });

    const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;

    if (!response.ok || !payload?.url) {
      return { ok: false, error: payload?.error || 'فشل رفع الصورة — حاول مرة أخرى' };
    }
    return { ok: true, url: payload.url };
  } catch {
    return { ok: false, error: 'تعذّر الاتصال بالخادم — تحقق من اتصالك وحاول مرة أخرى' };
  }
}

/** حذف صورة رُفعت ولم تُحفظ بعد (best-effort — يتجاهل الأخطاء) */
export async function deleteUploadedImage(kind: ClientUploadKind, url: string): Promise<void> {
  try {
    await fetch(`/api/upload/${kind}?url=${encodeURIComponent(url)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
  } catch {
    // تنظيف اختياري — لا نعرقل المستخدم
  }
}
