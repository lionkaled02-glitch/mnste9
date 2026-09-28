import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

const BACKUP_FILENAME_PATTERN = /^backup-[A-Za-z0-9._-]+\.json$/;

function isSafeBackupFilename(filename: string) {
  return BACKUP_FILENAME_PATTERN.test(filename) && !filename.includes('/') && !filename.includes('\\') && path.basename(filename) === filename;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
  if (!filename || !isSafeBackupFilename(filename)) {
    return NextResponse.json({ error: 'اسم غير صالح' }, { status: 400 });
  }

  try {
    const filepath = path.join(process.cwd(), 'storage', 'backups', filename);
    const content = await readFile(filepath);
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 });
  }
}
