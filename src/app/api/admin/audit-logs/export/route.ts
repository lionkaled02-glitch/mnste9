import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { auditLogs, users } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
function csv(rows: unknown[][]) { return rows.map((row)=>row.map((cell)=>`"${String(cell ?? '').replaceAll('"','""')}"`).join(',')).join('\n'); }
export async function GET() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== 'admin') return new NextResponse('غير مصرح', { status: 403 });
  const rows = await db.select({ adminName: users.name, action: auditLogs.action, targetType: auditLogs.targetType, targetId: auditLogs.targetId, ip: auditLogs.ip, createdAt: auditLogs.createdAt }).from(auditLogs).leftJoin(users, eq(users.id, auditLogs.adminId)).orderBy(desc(auditLogs.createdAt)).limit(2000);
  const body = csv([['admin','action','targetType','targetId','ip','date'], ...rows.map((r)=>[r.adminName, r.action, r.targetType, r.targetId, r.ip, r.createdAt.toISOString()])]);
  return new NextResponse(`\uFEFF${body}`, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="audit-logs.csv"' } });
}
