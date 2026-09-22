/**
 * خدمات — استعلامات لوحة التحكم — نظام موحد #2386c8
 * - كل مستخدم (client/freelancer) له نفس الإحصائيات: مشاريعه + عروضه
 */

import { and, count, desc, eq, inArray, or, sql } from 'drizzle-orm';

import { db } from '@/db';
import { projects, proposals, wallets } from '@/db/schema';
import type { ProjectStatus } from '@/lib/services/projects';

const ACTIVE_STATUSES: ProjectStatus[] = ['open', 'in_progress'];

type UserRole = 'client' | 'freelancer' | 'admin';

export interface DashboardStats {
  activeProjects: number;
  proposals: number;
  walletBalance: string;
  walletPendingBalance: string;
}

export interface DashboardProjectItem {
  id: number;
  title: string;
  status: ProjectStatus;
  budgetMin: string;
  budgetMax: string;
  durationDays: number;
  createdAt: Date;
}

export async function getDashboardStats(userId: number, _role: UserRole): Promise<DashboardStats> {
  const [walletRow, activeOwned, activeProposed, proposalsReceived, proposalsSent] = await Promise.all([
    db.select({ balance: wallets.balance, pendingBalance: wallets.pendingBalance }).from(wallets).where(eq(wallets.userId, userId)).limit(1),
    db.select({ value: count() }).from(projects).where(and(eq(projects.clientId, userId), inArray(projects.status, ACTIVE_STATUSES))),
    db
      .select({ value: sql<number>`COUNT(DISTINCT ${proposals.projectId})`.mapWith(Number) })
      .from(proposals)
      .innerJoin(projects, eq(proposals.projectId, projects.id))
      .where(and(eq(proposals.freelancerId, userId), inArray(projects.status, ACTIVE_STATUSES))),
    db.select({ value: count() }).from(proposals).innerJoin(projects, eq(proposals.projectId, projects.id)).where(eq(projects.clientId, userId)),
    db.select({ value: count() }).from(proposals).where(eq(proposals.freelancerId, userId)),
  ]);

  const activeProjects = Number(activeOwned[0]?.value ?? 0) + Number(activeProposed[0]?.value ?? 0);
  const totalProposals = Number(proposalsReceived[0]?.value ?? 0) + Number(proposalsSent[0]?.value ?? 0);

  return {
    activeProjects,
    proposals: totalProposals,
    walletBalance: walletRow[0]?.balance ?? '0.00',
    walletPendingBalance: walletRow[0]?.pendingBalance ?? '0.00',
  };
}

export async function getLatestProjects(userId: number, _role: UserRole, limit = 5): Promise<DashboardProjectItem[]> {
  const columns = {
    id: projects.id,
    title: projects.title,
    status: projects.status,
    budgetMin: projects.budgetMin,
    budgetMax: projects.budgetMax,
    durationDays: projects.durationDays,
    createdAt: projects.createdAt,
  };

  // Unified: أحدث مشاريعه + أحدث المشاريع المفتوحة (فرص)
  const owned = await db.select(columns).from(projects).where(eq(projects.clientId, userId)).orderBy(desc(projects.createdAt), desc(projects.id)).limit(limit);

  if (owned.length >= limit) return owned;

  const open = await db
    .select(columns)
    .from(projects)
    .where(and(eq(projects.status, 'open'), sql`${projects.clientId} != ${userId}`))
    .orderBy(desc(projects.createdAt), desc(projects.id))
    .limit(limit);

  const merged = [...owned, ...open.filter((o) => !owned.some((a) => a.id === o.id))];
  merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return merged.slice(0, limit);
}
