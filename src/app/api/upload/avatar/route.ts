/**
 * ============================================================================
 *  خدمات — API رفع الصورة الشخصية (POST /api/upload/avatar)
 * ============================================================================
 *  - يتطلب جلسة صالحة (كوكي الجلسة) — 401 بدونها.
 *  - يستقبل multipart/form-data بحقل `file` (JPG/PNG/WEBP ≤ 5MB).
 *  - يحفظ الملف في public/uploads/avatars/<userId>-<timestamp>.<ext>
 *    ويعيد { url: "/uploads/avatars/<filename>" }.
 *  - المسار المعاد يُوضع في حقل avatarUrl بنموذج الملف الشخصي ويُحفظ
 *    في users.avatar_url عند الضغط على «حفظ التغييرات» (معاينة قبل الحفظ).
 *  - حقل اختياري `replace`: مسار رفع سابق لم يُحفظ بعد يُحذف بعد نجاح
 *    الرفع الجديد (تنظيف الملفات اليتيمة).
 *
 *  DELETE /api/upload/avatar?url=/uploads/avatars/<filename>
 *  - يحذف ملفاً يملكه المستخدم الحالي (البادئة <userId>-) لم يُحفظ بعد.
 *  - الصورة المحفوظة في قاعدة البيانات تُحذف من خلال إجراء الملف الشخصي
 *    (updateProfile) عند الحفظ — وليس هنا — كي يبقى «حفظ» هو نقطة الالتزام.
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

  const result = await saveUploadedImage(file, 'avatars', user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // تنظيف: حذف رفع سابق لم يُحفظ (يملكه المستخدم نفسه فقط)
  const replace = formData.get('replace');
  if (typeof replace === 'string' && replace !== result.url && isOwnedUploadUrl(replace, 'avatars', user.id)) {
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
  if (!url || !isOwnedUploadUrl(url, 'avatars', user.id)) {
    return NextResponse.json({ error: 'مسار غير صالح' }, { status: 400 });
  }

  const deleted = await deleteLocalUpload(url);
  return NextResponse.json({ ok: deleted });
}
