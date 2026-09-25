import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ['application/pdf', 'pdf'],
  ['application/zip', 'zip'],
  ['application/x-zip-compressed', 'zip'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
]);

function safeTimestamp(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح — سجّل دخولك أولاً' }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح — يجب إرسال نموذج ملفات' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: 'اختر ملفاً أولاً' }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'حجم الملف يتجاوز 10MB' }, { status: 400 });

  const ext = ALLOWED_TYPES.get(file.type);
  if (!ext) return NextResponse.json({ error: 'صيغة الملف غير مدعومة — PDF أو ZIP أو DOCX فقط' }, { status: 400 });

  const directory = path.join(process.cwd(), 'public', 'uploads', 'portfolio');
  await mkdir(directory, { recursive: true });
  const filename = `${user.id}-${safeTimestamp()}.${ext}`;
  await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/uploads/portfolio/${filename}`, name: file.name });
}
