/**
 * ============================================================================
 *  خدمات — تقديم الصور المرفوعة في الإنتاج: GET /uploads/<kind>/<filename>
 * ============================================================================
 *  لماذا؟ خادم next start يفهرس مجلد public مرة واحدة عند الإقلاع، لذا
 *  الصور المرفوعة أثناء التشغيل (public/uploads/...) تُعيد 404 كملفات
 *  ثابتة. هذا الـ Route يخدمها من القرص بنفس المسار المحفوظ في قاعدة
 *  البيانات، فلا يتغير عقد الرفع (/uploads/avatars/[userId]-[timestamp].[ext]).
 *
 *  - الملفات الموجودة عند الإقلاع تُخدَّم ثابتاً (أولوية public) — لا تعارض.
 *  - مسار عام (الصور الشخصية وصور الأعمال معروضة للجميع) لكن مقيّد
 *    بنمط صارم: kind ∈ {avatars, portfolio} + اسم ملف آمن + امتداد صورة.
 *  - كاش طويل: الأسماء فريدة (timestamp) والملفات لا تُعدَّل بعد الرفع.
 * ============================================================================
 */

import { NextResponse } from 'next/server';

import { readLocalUpload } from '@/lib/uploads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CACHE_CONTROL = 'public, max-age=31536000, immutable';

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await context.params;

  if (!Array.isArray(segments) || segments.length !== 2) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const [kind, filename] = segments;
  const file = await readLocalUpload(kind, filename);
  if (!file) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const headers = new Headers({
    'Content-Type': file.mimeType,
    'Cache-Control': CACHE_CONTROL,
    ETag: file.etag,
    'Last-Modified': file.lastModified.toUTCString(),
    'X-Content-Type-Options': 'nosniff',
  });

  if (request.headers.get('if-none-match') === file.etag) {
    return new NextResponse(null, { status: 304, headers });
  }

  headers.set('Content-Length', String(file.size));
  return new NextResponse(new Uint8Array(file.data), { status: 200, headers });
}
