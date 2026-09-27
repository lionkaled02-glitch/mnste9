import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { transactions, users, wallets } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';

function csv(rows: unknown[][]) { return rows.map((row)=>row.map((cell)=>`"${String(cell ?? '').replaceAll('"','""')}"`).join(',')).join('\n'); }

export async function GET() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== 'admin') return new NextResponse('غير مصرح', { status: 403 });
  const walletRows = await db.select({ user: users.email, balance: wallets.balance, pending: wallets.pendingBalance, updatedAt: wallets.updatedAt }).from(wallets).leftJoin(users, eq(users.id, wallets.userId)).orderBy(desc(wallets.updatedAt)).limit(1000);
  const txRows = await db.select({ id: transactions.id, userId: transactions.userId, type: transactions.type, amount: transactions.amount, status: transactions.status, createdAt: transactions.createdAt }).from(transactions).orderBy(desc(transactions.createdAt)).limit(1000);
  const body = csv([['section','user/id','balance/type','pending/amount','status','date'], ...walletRows.map((w)=>['wallet', w.user, w.balance, w.pending, '', w.updatedAt.toISOString()]), ...txRows.map((t)=>['transaction', t.userId, t.type, t.amount, t.status, t.createdAt.toISOString()])]);
  return new NextResponse(`\uFEFF${body}`, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="wallet-export.csv"' } });
}
