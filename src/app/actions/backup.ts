'use server';

import { mkdir, readdir, readFile, unlink, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';

import { revalidatePath } from 'next/cache';

import { db } from '@/db';
import {
  auditLogs,
  contracts,
  conversations,
  failedLoginAttempts,
  kycDocuments,
  messages,
  notifications,
  platformSettings,
  portfolioItems,
  projects,
  proposals,
  rateLimits,
  reviews,
  sessions,
  transactions,
  users,
  wallets,
  wishlist,
} from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';

import { createAuditLog } from './admin';

const BACKUP_DIR = path.join(process.cwd(), 'storage', 'backups');
const BACKUP_FILENAME_PATTERN = /^backup-[A-Za-z0-9._-]+\.json$/;
const RESTORE_CONFIRMATION = 'استعادة';

export interface BackupFileInfo {
  filename: string;
  size: number;
  createdAt: Date;
}

export type BackupActionResult =
  | { success: true; message?: string; filename?: string; recordsCount?: number; backups?: BackupFileInfo[] }
  | { success: false; message?: string; backups?: BackupFileInfo[] };

async function ensureBackupDir() {
  await mkdir(BACKUP_DIR, { recursive: true });
}

function isSafeBackupFilename(filename: string) {
  return BACKUP_FILENAME_PATTERN.test(filename) && !filename.includes('/') && !filename.includes('\\') && path.basename(filename) === filename;
}

async function requireAdmin() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== 'admin') return null;
  return admin;
}

function rows<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

async function insertRows(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], table: any, values: unknown[]) {
  if (values.length === 0) return;
  await tx.insert(table).overridingSystemValue().values(values as any[]);
}

export async function createBackupAction(): Promise<BackupActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, message: 'غير مصرح' };

  try {
    await ensureBackupDir();

    const data = {
      users: await db.select().from(users),
      projects: await db.select().from(projects),
      proposals: await db.select().from(proposals),
      contracts: await db.select().from(contracts),
      transactions: await db.select().from(transactions),
      wallets: await db.select().from(wallets),
      kycDocuments: await db.select().from(kycDocuments),
      portfolioItems: await db.select().from(portfolioItems),
      notifications: await db.select().from(notifications),
      conversations: await db.select().from(conversations),
      messages: await db.select().from(messages),
      reviews: await db.select().from(reviews),
      wishlist: await db.select().from(wishlist),
      platformSettings: await db.select().from(platformSettings),
      auditLogs: await db.select().from(auditLogs),
      sessions: await db.select().from(sessions),
      failedLoginAttempts: await db.select().from(failedLoginAttempts),
      rateLimits: await db.select().from(rateLimits),
    };

    const recordsCount = Object.values(data).reduce((sum, tableRows) => sum + tableRows.length, 0);
    const metadata = {
      createdAt: new Date().toISOString(),
      version: '1.0',
      platform: 'خدمات',
      recordsCount,
      createdBy: admin.id,
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    await writeFile(filepath, JSON.stringify({ metadata, data }, null, 2), 'utf-8');
    await createAuditLog({ adminId: admin.id, action: 'create_backup', targetType: 'backup', metadata: { filename, recordsCount } });

    revalidatePath('/admin/backup');
    return { success: true, filename, recordsCount, message: 'تم إنشاء النسخة الاحتياطية' };
  } catch (error) {
    console.error('createBackupAction failed', error);
    return { success: false, message: 'فشل إنشاء النسخة' };
  }
}

export async function listBackupsAction(): Promise<BackupActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, backups: [] };

  try {
    await ensureBackupDir();
    const files = await readdir(BACKUP_DIR);
    const backups = await Promise.all(
      files
        .filter((filename) => isSafeBackupFilename(filename))
        .map(async (filename) => {
          const filepath = path.join(BACKUP_DIR, filename);
          const stats = await stat(filepath);
          return { filename, size: stats.size, createdAt: stats.birthtime };
        }),
    );

    backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { success: true, backups };
  } catch (error) {
    console.error('listBackupsAction failed', error);
    return { success: false, backups: [] };
  }
}

export async function deleteBackupAction(filename: string): Promise<BackupActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, message: 'غير مصرح' };
  if (!isSafeBackupFilename(filename)) return { success: false, message: 'اسم الملف غير صالح' };

  try {
    await unlink(path.join(BACKUP_DIR, filename));
    await createAuditLog({ adminId: admin.id, action: 'delete_backup', targetType: 'backup', metadata: { filename } });
    revalidatePath('/admin/backup');
    return { success: true, message: 'تم حذف النسخة' };
  } catch (error) {
    console.error('deleteBackupAction failed', error);
    return { success: false, message: 'فشل الحذف' };
  }
}

export async function restoreBackupAction(filename: string, confirmation?: string): Promise<BackupActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, message: 'غير مصرح' };
  if (!isSafeBackupFilename(filename)) return { success: false, message: 'اسم الملف غير صالح' };
  if (confirmation !== RESTORE_CONFIRMATION) return { success: false, message: 'تأكيد الاستعادة غير صحيح' };

  try {
    const content = await readFile(path.join(BACKUP_DIR, filename), 'utf-8');
    const backup = JSON.parse(content) as { data?: Record<string, unknown> };
    if (!backup.data || typeof backup.data !== 'object') return { success: false, message: 'ملف النسخة غير صالح' };
    const backupData = backup.data;

    await db.transaction(async (tx) => {
      await tx.delete(messages);
      await tx.delete(conversations);
      await tx.delete(notifications);
      await tx.delete(reviews);
      await tx.delete(wishlist);
      await tx.delete(auditLogs);
      await tx.delete(sessions);
      await tx.delete(failedLoginAttempts);
      await tx.delete(rateLimits);
      await tx.delete(kycDocuments);
      await tx.delete(portfolioItems);
      await tx.delete(transactions);
      await tx.delete(contracts);
      await tx.delete(proposals);
      await tx.delete(projects);
      await tx.delete(wallets);
      await tx.delete(platformSettings);

      await insertRows(tx, projects, rows(backupData.projects));
      await insertRows(tx, proposals, rows(backupData.proposals));
      await insertRows(tx, contracts, rows(backupData.contracts));
      await insertRows(tx, transactions, rows(backupData.transactions));
      await insertRows(tx, wallets, rows(backupData.wallets));
      await insertRows(tx, kycDocuments, rows(backupData.kycDocuments));
      await insertRows(tx, portfolioItems, rows(backupData.portfolioItems));
      await insertRows(tx, notifications, rows(backupData.notifications));
      await insertRows(tx, conversations, rows(backupData.conversations));
      await insertRows(tx, messages, rows(backupData.messages));
      await insertRows(tx, reviews, rows(backupData.reviews));
      await insertRows(tx, wishlist, rows(backupData.wishlist));
      await insertRows(tx, platformSettings, rows(backupData.platformSettings));
      await insertRows(tx, auditLogs, rows(backupData.auditLogs));
      await insertRows(tx, sessions, rows(backupData.sessions));
      await insertRows(tx, failedLoginAttempts, rows(backupData.failedLoginAttempts));
      await insertRows(tx, rateLimits, rows(backupData.rateLimits));
    });

    await createAuditLog({ adminId: admin.id, action: 'restore_backup', targetType: 'backup', metadata: { filename } });
    revalidatePath('/admin/backup');
    return { success: true, message: 'تمت الاستعادة بنجاح' };
  } catch (error) {
    console.error('restoreBackupAction failed', error);
    return { success: false, message: 'فشل الاستعادة' };
  }
}
