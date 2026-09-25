/**
 * ============================================================================
 *  خدمات — API رفع صورة عمل في معرض الأعمال (POST /api/upload/portfolio)
 * ============================================================================
 *  - يتطلب جلسة صالحة — 401 بدونها.
 *  - يستقبل multipart/form-data بحقل `file` (JPG/PNG/WEBP ≤ 5MB).
 *  - يحفظ الملف في public/uploads/portfolio/<userId>-<timestamp>.<ext>
 *    ويعيد { url: "/uploads/portfolio/<filename>" }.
 *  - المسار المعاد يُوضع في حقل imageUrl بنموذج إضافة العمل ويُحفظ في
 *    portfolio_items.image_url عند الضغط على «إضافة العمل».
 *  - حقل اختياري `replace`: رفع سابق لم يُحفظ بعد يُحذف بعد نجاح الجديد.
 *
 *  DELETE /api/upload/portfolio?url=/uploads/portfolio/<filename>
 *  - يحذف ملفاً يملكه المستخدم الحالي لم يُحفظ بعد (تنظيف المعاينة).
 *  - صور الأعمال المحفوظة تُحذف مع حذف العمل نفسه (actions/portfolio.ts).
 * ============================================================================
 */

import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { deleteLocalUpload, isOwnedUploadUrl, saveUploadedImage } from '@/lib/uploads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'غير مصرح — سجّل دخولك أولاً' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح — يجب إرسال نموذج ملفات' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'لا يوجد ملف — اختر صورة أولاً' }, { status: 400 });
  }

  const result = await saveUploadedImage(file, 'portfolio', user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const replace = formData.get('replace');
  if (typeof replace === 'string' && replace !== result.url && isOwnedUploadUrl(replace, 'portfolio', user.id)) {
    await deleteLocalUpload(replace);
  }

  return NextResponse.json({ url: result.url });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'غير مصرح — سجّل دخولك أولاً' }, { status: 401 });
  }

  const url = new URL(request.url).searchParams.get('url');
  if (!url || !isOwnedUploadUrl(url, 'portfolio', user.id)) {
    return NextResponse.json({ error: 'مسار غير صالح' }, { status: 400 });
  }

  const deleted = await deleteLocalUpload(url);
  return NextResponse.json({ ok: deleted });
}
