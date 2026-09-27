import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
function csv(rows: unknown[][]) { return rows.map((row)=>row.map((cell)=>`"${String(cell ?? '').replaceAll('"','""')}"`).join(',')).join('\n'); }
export async function GET() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== 'admin') return new NextResponse('غير مصرح', { status: 403 });
  const rows = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, isKycVerified: users.isKycVerified, createdAt: users.createdAt }).from(users).orderBy(desc(users.createdAt)).limit(5000);
  const body = csv([['id','name','email','role','kyc','createdAt'], ...rows.map((u)=>[u.id, u.name, u.email, u.role, u.isKycVerified ? 'verified' : 'pending', u.createdAt.toISOString()])]);
  return new NextResponse(`\uFEFF${body}`, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="users-export.csv"' } });
}
