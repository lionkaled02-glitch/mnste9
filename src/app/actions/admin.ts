'use server';

import { readFile } from 'node:fs/promises';

import { and, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/db';
import { contracts, kycDocuments, notifications, platformSettings, projects, proposals, reviews, transactions, users, wallets } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { decryptBuffer, decryptData } from '@/lib/crypto';
import { sendKYCApprovedEmail, sendKYCRejectedEmail } from '@/lib/services/email';
import { createNotification } from '@/lib/services/notifications';

export type AdminActionResult = { success: boolean; message?: string };

async function requireAdmin(): Promise<{ id: number } | AdminActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, message: 'سجّل دخولك أولاً' };
  if (currentUser.role !== 'admin') return { success: false, message: 'غير مصرح' };
  return { id: currentUser.id };
}

function numberValue(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  return 0;
}

function sniffImageMime(buffer: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 && buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a) return 'image/png';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

export interface AdminKycImagePreview {
  key: 'front' | 'back' | 'selfie';
  label: string;
  dataUrl: string | null;
  error: string | null;
}

async function readKycImagePreview(key: AdminKycImagePreview['key'], label: string, encryptedPath: string | null): Promise<AdminKycImagePreview> {
  if (!encryptedPath) return { key, label, dataUrl: null, error: 'لا توجد صورة مرفوعة لهذا الحقل' };

  try {
    const relativePath = decryptData(encryptedPath);
    const encryptedBytes = await readFile(relativePath);
    const plainBytes = decryptBuffer(encryptedBytes);
    const mimeType = sniffImageMime(plainBytes);

    if (!mimeType) {
      return { key, label, dataUrl: null, error: 'الملف المرفوع ليس صورة قابلة للعرض داخل المتصفح' };
    }

    return {
      key,
      label,
      dataUrl: `data:${mimeType};base64,${plainBytes.toString('base64')}`,
      error: null,
    };
  } catch (error) {
    console.error('readKycImagePreview failed:', error);
    return { key, label, dataUrl: null, error: 'تعذر فك تشفير الصورة أو قراءة الملف من التخزين' };
  }
}

export async function getAdminKycImagePreviews(input: {
  frontFilePath: string | null;
  backFilePath: string | null;
  selfieFilePath: string | null;
}): Promise<AdminKycImagePreview[]> {
  return Promise.all([
    readKycImagePreview('front', 'الوجه الأمامي', input.frontFilePath),
    readKycImagePreview('back', 'الوجه الخلفي', input.backFilePath),
    readKycImagePreview('selfie', 'السيلفي', input.selfieFilePath),
  ]);
}

export async function getAdminDashboard() {
  const [usersTotal, usersWeek, projectsTotal, projectsOpen, proposalsTotal, proposalsPending, activeContracts, completedContracts, revenue, monthlyRevenue, escrow, pendingKyc, pendingWithdrawals, disputedContracts, latestUsers, latestProjects, latestKyc] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(users).where(sql`${users.createdAt} >= now() - interval '7 days'`),
    db.select({ value: count() }).from(projects),
    db.select({ value: count() }).from(projects).where(eq(projects.status, 'open')),
    db.select({ value: count() }).from(proposals),
    db.select({ value: count() }).from(proposals).where(eq(proposals.status, 'pending')),
    db.select({ value: count() }).from(contracts).where(eq(contracts.status, 'active')),
    db.select({ value: count() }).from(contracts).where(eq(contracts.status, 'completed')),
    db.select({ value: sql<string>`coalesce(sum(${contracts.commission}), 0)` }).from(contracts).where(eq(contracts.status, 'completed')),
    db.select({ value: sql<string>`coalesce(sum(${contracts.commission}), 0)` }).from(contracts).where(sql`${contracts.status} = 'completed' and ${contracts.updatedAt} >= date_trunc('month', now())`),
    db.select({ value: sql<string>`coalesce(sum(${contracts.amount}), 0)` }).from(contracts).where(eq(contracts.status, 'active')),
    db.select({ value: count() }).from(kycDocuments).where(eq(kycDocuments.status, 'pending')),
    db.select({ value: count() }).from(transactions).where(and(eq(transactions.type, 'withdrawal'), eq(transactions.status, 'pending'))),
    db.select({ value: count() }).from(contracts).where(eq(contracts.status, 'disputed')),
    db.select({ id: users.id, title: users.name, createdAt: users.createdAt }).from(users).orderBy(desc(users.createdAt)).limit(4),
    db.select({ id: projects.id, title: projects.title, createdAt: projects.createdAt }).from(projects).orderBy(desc(projects.createdAt)).limit(3),
    db.select({ id: kycDocuments.id, title: kycDocuments.documentType, createdAt: kycDocuments.createdAt }).from(kycDocuments).orderBy(desc(kycDocuments.createdAt)).limit(3),
  ]);

  return {
    stats: {
      usersTotal: usersTotal[0]?.value ?? 0,
      usersWeek: usersWeek[0]?.value ?? 0,
      projectsTotal: projectsTotal[0]?.value ?? 0,
      projectsOpen: projectsOpen[0]?.value ?? 0,
      proposalsTotal: proposalsTotal[0]?.value ?? 0,
      proposalsPending: proposalsPending[0]?.value ?? 0,
      activeContracts: activeContracts[0]?.value ?? 0,
      completedContracts: completedContracts[0]?.value ?? 0,
      revenue: numberValue(revenue[0]?.value),
      monthlyRevenue: numberValue(monthlyRevenue[0]?.value),
      escrow: numberValue(escrow[0]?.value),
      pendingKyc: pendingKyc[0]?.value ?? 0,
      pendingWithdrawals: pendingWithdrawals[0]?.value ?? 0,
      disputedContracts: disputedContracts[0]?.value ?? 0,
    },
    chart: Array.from({ length: 30 }, (_, index) => ({ day: index + 1, users: Math.max(1, (index * 3) % 17), revenue: Math.max(20, (index * 47) % 800) })),
    activities: [
      ...latestUsers.map((row) => ({ id: `u-${row.id}`, title: `مستخدم جديد: ${row.title}`, createdAt: row.createdAt })),
      ...latestProjects.map((row) => ({ id: `p-${row.id}`, title: `مشروع جديد: ${row.title}`, createdAt: row.createdAt })),
      ...latestKyc.map((row) => ({ id: `k-${row.id}`, title: `طلب KYC: ${row.title}`, createdAt: row.createdAt })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10),
  };
}

export async function getAdminUsers(params: { role?: string; kyc?: string; q?: string } = {}) {
  const filters = [];
  if (params.role && ['client', 'freelancer', 'admin'].includes(params.role)) filters.push(eq(users.role, params.role));
  if (params.kyc === 'verified') filters.push(eq(users.isKycVerified, true));
  if (params.kyc === 'unverified') filters.push(eq(users.isKycVerified, false));
  if (params.q) filters.push(or(ilike(users.name, `%${params.q}%`), ilike(users.email, `%${params.q}%`))!);
  return db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, isKycVerified: users.isKycVerified, avatarUrl: users.avatarUrl, createdAt: users.createdAt, updatedAt: users.updatedAt, balance: wallets.balance })
    .from(users)
    .leftJoin(wallets, eq(wallets.userId, users.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(100);
}

export async function getAdminUserDetails(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) return null;
  const [userProjects, userContracts, userTransactions, userReviews] = await Promise.all([
    db.select().from(projects).where(eq(projects.clientId, id)).orderBy(desc(projects.createdAt)).limit(10),
    db.select().from(contracts).where(or(eq(contracts.clientId, id), eq(contracts.freelancerId, id))!).orderBy(desc(contracts.createdAt)).limit(10),
    db.select().from(transactions).where(eq(transactions.userId, id)).orderBy(desc(transactions.createdAt)).limit(10),
    db.select().from(reviews).where(or(eq(reviews.reviewerId, id), eq(reviews.reviewedId, id))!).orderBy(desc(reviews.createdAt)).limit(10),
  ]);
  return { user, projects: userProjects, contracts: userContracts, transactions: userTransactions, reviews: userReviews };
}

export async function getAdminKyc(status = 'pending') {
  const safeStatus = ['pending', 'approved', 'rejected'].includes(status) ? status : 'pending';
  return db
    .select({ id: kycDocuments.id, userId: kycDocuments.userId, userName: users.name, userEmail: users.email, avatarUrl: users.avatarUrl, documentType: kycDocuments.documentType, documentNumber: kycDocuments.documentNumber, status: kycDocuments.status, createdAt: kycDocuments.createdAt })
    .from(kycDocuments)
    .leftJoin(users, eq(users.id, kycDocuments.userId))
    .where(eq(kycDocuments.status, safeStatus))
    .orderBy(desc(kycDocuments.createdAt));
}

export async function getAdminKycDetails(identifier: number | string) {
  const rawIdentifier = typeof identifier === 'string' ? identifier.trim() : String(identifier);
  const numericId = /^\d+$/.test(rawIdentifier) ? Number(rawIdentifier) : null;

  if (numericId !== null && (!Number.isSafeInteger(numericId) || numericId <= 0)) return null;

  const whereClause =
    numericId !== null
      ? eq(kycDocuments.id, numericId)
      : or(
          eq(kycDocuments.encryptedFilePath, rawIdentifier),
          eq(kycDocuments.frontFilePath, rawIdentifier),
          eq(kycDocuments.backFilePath, rawIdentifier),
          eq(kycDocuments.selfieFilePath, rawIdentifier),
        );

  if (!whereClause) return null;

  const [row] = await db
    .select({ id: kycDocuments.id, userId: kycDocuments.userId, userName: users.name, userEmail: users.email, avatarUrl: users.avatarUrl, documentType: kycDocuments.documentType, documentNumber: kycDocuments.documentNumber, fullName: kycDocuments.fullName, issueDate: kycDocuments.issueDate, expiryDate: kycDocuments.expiryDate, issuePlace: kycDocuments.issuePlace, frontFilePath: kycDocuments.frontFilePath, backFilePath: kycDocuments.backFilePath, selfieFilePath: kycDocuments.selfieFilePath, status: kycDocuments.status, rejectionReason: kycDocuments.rejectionReason, createdAt: kycDocuments.createdAt })
    .from(kycDocuments)
    .leftJoin(users, eq(users.id, kycDocuments.userId))
    .where(whereClause)
    .limit(1);
  return row ?? null;
}

export async function approveKycAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if ('success' in admin) return;
  const id = Number(formData.get('id'));
  if (!Number.isSafeInteger(id)) return;
  const [doc] = await db.update(kycDocuments).set({ status: 'approved', reviewedBy: admin.id, reviewedAt: new Date(), rejectionReason: null }).where(eq(kycDocuments.id, id)).returning({ userId: kycDocuments.userId });
  if (doc) {
    await db.update(users).set({ isKycVerified: true }).where(eq(users.id, doc.userId));
    const [user] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, doc.userId)).limit(1);
    await createNotification({ userId: doc.userId, title: 'تم توثيق هويتك ✅', message: 'يمكنك الآن تقديم عروض وسحب الأرباح.', type: 'success', link: '/dashboard' });
    if (user) await sendKYCApprovedEmail(user.email, user.name);
  }
  revalidatePath('/admin/kyc');
}

export async function rejectKycAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if ('success' in admin) return;
  const id = Number(formData.get('id'));
  const reason = String(formData.get('reason') ?? '').trim() || 'الوثائق غير واضحة أو غير مطابقة';
  if (!Number.isSafeInteger(id)) return;
  const [doc] = await db.update(kycDocuments).set({ status: 'rejected', reviewedBy: admin.id, reviewedAt: new Date(), rejectionReason: reason }).where(eq(kycDocuments.id, id)).returning({ userId: kycDocuments.userId });
  if (doc) {
    await db.update(users).set({ isKycVerified: false }).where(eq(users.id, doc.userId));
    const [user] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, doc.userId)).limit(1);
    await createNotification({ userId: doc.userId, title: 'تم رفض توثيق هويتك', message: `السبب: ${reason}`, type: 'error', link: '/dashboard/kyc' });
    if (user) await sendKYCRejectedEmail(user.email, user.name, reason);
  }
  revalidatePath('/admin/kyc');
}

export async function getAdminProjects(status?: string) {
  const safeStatus = ['open', 'in_progress', 'completed', 'cancelled'].includes(status ?? '') ? (status as 'open' | 'in_progress' | 'completed' | 'cancelled') : undefined;
  const filters = safeStatus ? eq(projects.status, safeStatus) : undefined;
  return db
    .select({ id: projects.id, title: projects.title, clientName: users.name, budgetMin: projects.budgetMin, budgetMax: projects.budgetMax, status: projects.status, createdAt: projects.createdAt, proposalsCount: sql<number>`(select count(*)::int from proposals where proposals.project_id = ${projects.id})` })
    .from(projects)
    .leftJoin(users, eq(users.id, projects.clientId))
    .where(filters)
    .orderBy(desc(projects.createdAt))
    .limit(100);
}

export async function getAdminProposals(status?: string) {
  const filters = status && ['pending', 'accepted', 'rejected', 'withdrawn'].includes(status) ? eq(proposals.status, status) : undefined;
  const rows = await db.select({ id: proposals.id, projectId: proposals.projectId, freelancerId: proposals.freelancerId, amount: proposals.amount, durationDays: proposals.durationDays, status: proposals.status, createdAt: proposals.createdAt }).from(proposals).where(filters).orderBy(desc(proposals.createdAt)).limit(100);
  const projectRows = await db.select({ id: projects.id, title: projects.title }).from(projects);
  const userRows = await db.select({ id: users.id, name: users.name }).from(users);
  const projectMap = new Map(projectRows.map((p) => [p.id, p.title]));
  const userMap = new Map(userRows.map((u) => [u.id, u.name]));
  return rows.map((row) => ({ ...row, projectTitle: projectMap.get(row.projectId) ?? 'مشروع', freelancerName: userMap.get(row.freelancerId) ?? 'مستقل' }));
}

export async function getAdminContracts(status?: string) {
  const filters = status && ['pending', 'active', 'pending_delivery', 'completed', 'disputed', 'cancelled'].includes(status) ? eq(contracts.status, status) : undefined;
  const rows = await db.select().from(contracts).where(filters).orderBy(desc(contracts.createdAt)).limit(100);
  const [projectRows, userRows] = await Promise.all([db.select({ id: projects.id, title: projects.title }).from(projects), db.select({ id: users.id, name: users.name }).from(users)]);
  const projectMap = new Map(projectRows.map((p) => [p.id, p.title]));
  const userMap = new Map(userRows.map((u) => [u.id, u.name]));
  return rows.map((row) => ({ ...row, projectTitle: projectMap.get(row.projectId) ?? 'مشروع', clientName: userMap.get(row.clientId) ?? 'عميل', freelancerName: userMap.get(row.freelancerId) ?? 'مستقل' }));
}

export async function getAdminContractDetails(id: number) {
  const [row] = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  if (!row) return null;
  const [project] = await db.select({ title: projects.title }).from(projects).where(eq(projects.id, row.projectId)).limit(1);
  const userRows = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(or(eq(users.id, row.clientId), eq(users.id, row.freelancerId))!);
  return { contract: row, projectTitle: project?.title ?? 'مشروع', users: userRows };
}

export async function getAdminWallet() {
  const [walletRows, transactionRows] = await Promise.all([
    db.select({ id: wallets.id, userId: wallets.userId, userName: users.name, balance: wallets.balance, pendingBalance: wallets.pendingBalance, updatedAt: wallets.updatedAt }).from(wallets).leftJoin(users, eq(users.id, wallets.userId)).orderBy(desc(wallets.updatedAt)).limit(100),
    db.select({ id: transactions.id, userId: transactions.userId, amount: transactions.amount, type: transactions.type, status: transactions.status, createdAt: transactions.createdAt }).from(transactions).orderBy(desc(transactions.createdAt)).limit(20),
  ]);
  return { wallets: walletRows, transactions: transactionRows };
}

export async function getAdminWithdrawals(status = 'pending') {
  const safeStatus = (['pending', 'completed', 'failed', 'refunded'].includes(status) ? status : 'pending') as 'pending' | 'completed' | 'failed' | 'refunded';
  return db.select({ id: transactions.id, userId: transactions.userId, userName: users.name, amount: transactions.amount, paymentMethod: transactions.paymentMethod, status: transactions.status, referenceId: transactions.referenceId, createdAt: transactions.createdAt }).from(transactions).leftJoin(users, eq(users.id, transactions.userId)).where(and(eq(transactions.type, 'withdrawal'), eq(transactions.status, safeStatus))).orderBy(desc(transactions.createdAt));
}

export async function getAdminReviews() {
  const rows = await db.select().from(reviews).orderBy(desc(reviews.createdAt)).limit(100);
  const userRows = await db.select({ id: users.id, name: users.name }).from(users);
  const userMap = new Map(userRows.map((u) => [u.id, u.name]));
  return rows.map((row) => ({ ...row, reviewerName: userMap.get(row.reviewerId) ?? 'مستخدم', reviewedName: userMap.get(row.reviewedId) ?? 'مستخدم' }));
}

export async function getAdminNotifications() {
  return db.select({ id: notifications.id, userId: notifications.userId, userName: users.name, title: notifications.title, message: notifications.message, type: notifications.type, isRead: notifications.isRead, createdAt: notifications.createdAt }).from(notifications).leftJoin(users, eq(users.id, notifications.userId)).orderBy(desc(notifications.createdAt)).limit(100);
}

export async function getAdminReports() {
  const dashboard = await getAdminDashboard();
  const roles = await db.select({ role: users.role, total: count() }).from(users).groupBy(users.role);
  const projectStatus = await db.select({ status: projects.status, total: count() }).from(projects).groupBy(projects.status);
  return { ...dashboard, roles, projectStatus };
}

export async function getAdminActivityLog() {
  const dashboard = await getAdminDashboard();
  return dashboard.activities;
}

export async function getAdminSettings() {
  return db.select().from(platformSettings).orderBy(desc(platformSettings.updatedAt));
}
