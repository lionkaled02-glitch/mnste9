import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { saveUploadedImage } from '@/lib/uploads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_IMAGES = 10;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح — سجّل دخولك أولاً' }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح — يجب إرسال نموذج ملفات' }, { status: 400 });
  }

  const files = formData.getAll('files').filter((file): file is File => file instanceof File && file.size > 0);
  if (files.length < 3) return NextResponse.json({ error: 'الحد الأدنى 3 صور لكل عمل' }, { status: 400 });
  if (files.length > MAX_IMAGES) return NextResponse.json({ error: `الحد الأقصى ${MAX_IMAGES} صور` }, { status: 400 });

  const urls: string[] = [];
  for (const file of files) {
    const saved = await saveUploadedImage(file, 'portfolio', user.id);
    if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: 400 });
    urls.push(saved.url);
  }

  return NextResponse.json({ urls });
}
