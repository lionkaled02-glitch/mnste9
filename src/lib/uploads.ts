/**
 * ============================================================================
 *  خدمات — تخزين الصور المرفوعة محلياً (Server-only)
 * ============================================================================
 *  الفكرة:
 *   - الصور (الشخصية / معرض الأعمال) تُحفظ في public/uploads/<kind>/
 *     باسم <userId>-<timestamp>.<ext> وتُخدَّم كملفات ثابتة على
 *     المسار /uploads/<kind>/<filename>.
 *   - المسار فقط هو ما يُحفظ في قاعدة البيانات
 *     (users.avatar_url / portfolio_items.image_url — varchar(500)).
 *
 *  الأمان (نقطة دخول غير موثوقة):
 *   - الحجم ≤ 5MB، والصيغ JPG/PNG/WEBP فقط.
 *   - لا نثق بامتداد اسم الملف الأصلي ولا بـ file.type وحده: نتحقق من
 *     التوقيع الثنائي (magic bytes) ونشتق الامتداد من النوع المكتشف.
 *   - أسماء الملفات تُولَّد خادمياً (لا مسارات من المستخدم) → لا Path Traversal.
 *   - الحذف مقيّد بنمط صارم داخل مجلد الرفع وبملكية المستخدم (البادئة userId-).
 *
 *  ملاحظة نشر: هذا تخزين على قرص الخادم — يعمل مع خادم Node دائم
 *  (next start / VPS). على منصات Serverless (مثل Vercel) القرص مؤقت
 *  ويجب استبدال saveUploadedImage بتخزين سحابي (S3/R2/Blob) مع إبقاء
 *  الواجهة نفسها.
 *
 *  ملاحظة تقديم: خادم الإنتاج (next start) يفهرس مجلد public مرة واحدة
 *  عند الإقلاع، فالملفات المرفوعة بعده لا تُخدَّم كملفات ثابتة. لذلك
 *  يوجد Route Handler في app/uploads/[...path]/route.ts يقرأ الملف من
 *  القرص عبر readLocalUpload — الملفات الموجودة عند الإقلاع تُخدَّم
 *  ثابتاً (أولوية public)، والجديدة عبر الـ Route بنفس المسار.
 * ============================================================================
 */

import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

/* ============================================================================
 * الثوابت (تُستورد أيضاً في العميل عبر lib/upload-client.ts — أبقها متطابقة)
 * ========================================================================== */

export const UPLOAD_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const UPLOAD_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type UploadKind = 'avatars' | 'portfolio';

export const UPLOAD_KINDS: readonly UploadKind[] = ['avatars', 'portfolio'];

const EXTENSION_BY_MIME: Record<(typeof UPLOAD_ALLOWED_MIME_TYPES)[number], string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** مجلد الرفع الجذري داخل public */
const UPLOADS_ROOT = path.join(process.cwd(), 'public', 'uploads');

/** اسم ملف مسموح: أرقام/حروف/شرطة/نقطة فقط — بلا فواصل مسارات */
const SAFE_FILENAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,120}$/;

/* ============================================================================
 * أدوات داخلية
 * ========================================================================== */

/** كشف نوع الصورة من التوقيع الثنائي (magic bytes) */
function sniffImageMime(buffer: Buffer): (typeof UPLOAD_ALLOWED_MIME_TYPES)[number] | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

/** تحليل مسار رفع محلي /uploads/<kind>/<filename> → أجزاؤه، أو null إن لم يطابق */
export function parseLocalUploadUrl(
  url: string | null | undefined,
): { kind: UploadKind; filename: string } | null {
  if (!url || typeof url !== 'string') return null;
  const match = /^\/uploads\/(avatars|portfolio)\/([^/]+)$/.exec(url.trim());
  if (!match) return null;
  const kind = match[1] as UploadKind;
  const filename = match[2];
  if (!SAFE_FILENAME_PATTERN.test(filename)) return null;
  return { kind, filename };
}

/** هل النص مسار رفع محلي صالح (اختيارياً من نوع محدد)؟ */
export function isLocalUploadUrl(url: string | null | undefined, kind?: UploadKind): boolean {
  const parsed = parseLocalUploadUrl(url);
  if (!parsed) return false;
  return kind ? parsed.kind === kind : true;
}

/** هل المسار ملف رفعه هذا المستخدم؟ (الملكية عبر البادئة <userId>-) */
export function isOwnedUploadUrl(url: string | null | undefined, kind: UploadKind, userId: number): boolean {
  const parsed = parseLocalUploadUrl(url);
  if (!parsed || parsed.kind !== kind) return false;
  return parsed.filename.startsWith(`${userId}-`);
}

/* ============================================================================
 * الواجهة العامة
 * ========================================================================== */

export type SaveUploadedImageResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * التحقق من صورة مرفوعة وحفظها على القرص.
 *
 * @returns { ok: true, url } حيث url = /uploads/<kind>/<userId>-<timestamp>.<ext>
 *          أو { ok: false, error } برسالة عربية ودّية صالحة للعرض.
 */
export async function saveUploadedImage(
  file: unknown,
  kind: UploadKind,
  userId: number,
): Promise<SaveUploadedImageResult> {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'لا يوجد ملف — اختر صورة أولاً' };
  }
  if (file.size > UPLOAD_MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: 'حجم الصورة كبير جداً — الحد الأقصى 5 ميغابايت' };
  }
  if (!(UPLOAD_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: 'صيغة غير مدعومة — المسموح: JPG أو PNG أو WEBP' };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // لا نثق بـ file.type وحده — نتحقق من التوقيع الثنائي الفعلي
  const detected = sniffImageMime(buffer);
  if (!detected) {
    return { ok: false, error: 'الملف ليس صورة صالحة (JPG/PNG/WEBP)' };
  }

  const extension = EXTENSION_BY_MIME[detected];
  const filename = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const directory = path.join(UPLOADS_ROOT, kind);

  try {
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, filename), buffer, { flag: 'wx' });
  } catch (error) {
    console.error('saveUploadedImage failed:', error);
    return { ok: false, error: 'تعذّر حفظ الصورة على الخادم — حاول مرة أخرى' };
  }

  return { ok: true, url: `/uploads/${kind}/${filename}` };
}

/**
 * حذف ملف مرفوع محلياً (best-effort — لا يرمي أخطاء).
 * يتجاهل أي مسار لا يطابق نمط /uploads/<kind>/<filename> الصارم.
 */
export async function deleteLocalUpload(url: string | null | undefined): Promise<boolean> {
  const parsed = parseLocalUploadUrl(url);
  if (!parsed) return false;

  const directory = path.join(UPLOADS_ROOT, parsed.kind);
  const target = path.join(directory, parsed.filename);

  // حارس إضافي ضد أي التفاف: الملف يجب أن يبقى داخل مجلد النوع
  if (path.dirname(target) !== directory) return false;

  try {
    await unlink(target);
    return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code !== 'ENOENT') console.error('deleteLocalUpload failed:', error);
    return false;
  }
}

/* ============================================================================
 * قراءة ملف مرفوع (لخدمته في الإنتاج عبر Route Handler)
 * ========================================================================== */

const MIME_BY_EXTENSION: Record<string, (typeof UPLOAD_ALLOWED_MIME_TYPES)[number]> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export interface LocalUploadFile {
  data: Buffer;
  mimeType: (typeof UPLOAD_ALLOWED_MIME_TYPES)[number];
  size: number;
  /** ETag ضعيف مشتق من الحجم ووقت التعديل */
  etag: string;
  lastModified: Date;
}

/**
 * يقرأ ملفاً من public/uploads/<kind>/<filename> بعد التحقق الصارم من
 * المسار والامتداد. يعيد null إن كان المسار غير صالح أو الملف غير موجود.
 */
export async function readLocalUpload(kind: string, filename: string): Promise<LocalUploadFile | null> {
  const parsed = parseLocalUploadUrl(`/uploads/${kind}/${filename}`);
  if (!parsed) return null;

  const extension = path.extname(parsed.filename).slice(1).toLowerCase();
  const mimeType = MIME_BY_EXTENSION[extension];
  if (!mimeType) return null;

  const directory = path.join(UPLOADS_ROOT, parsed.kind);
  const target = path.join(directory, parsed.filename);
  if (path.dirname(target) !== directory) return null;

  try {
    const info = await stat(target);
    if (!info.isFile()) return null;
    const data = await readFile(target);
    return {
      data,
      mimeType,
      size: info.size,
      etag: `W/"${info.size.toString(16)}-${Math.floor(info.mtimeMs).toString(16)}"`,
      lastModified: info.mtime,
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code !== 'ENOENT' && code !== 'ENOTDIR') console.error('readLocalUpload failed:', error);
    return null;
  }
}
