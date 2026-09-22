/**
 * خدمات — قوائم لوحة التحكم: مشاريعي وعروضي — نظام موحد #2386c8
 * - كل مستخدم (client/freelancer) له نفس الصلاحيات
 * - مشاريعي: المشاريع التي نشرها + المشاريع التي قدم عليها عرضاً
 * - عروضي: العروض المستلمة على مشاريعه + العروض التي قدمها
 */

import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';

import { db } from '@/db';
import { projects, proposals, users } from '@/db/schema';
import type { ProjectStatus } from '@/db/schema';

type UserRole = 'client' | 'freelancer' | 'admin';

export type ProjectTabFilter = 'all' | 'open' | 'in_progress' | 'completed';
export type ProposalTabFilter = 'all' | 'pending' | 'accepted' | 'rejected';

export function parseProjectTab(value: string | undefined): ProjectTabFilter {
  return value === 'open' || value === 'in_progress' || value === 'completed' ? value : 'all';
}

export function parseProposalTab(value: string | undefined): ProposalTabFilter {
  return value === 'pending' || value === 'accepted' || value === 'rejected' ? value : 'all';
}

const LIST_LIMIT = 50;

export interface DashboardProjectItem {
  id: number;
  title: string;
  description: string;
  status: ProjectStatus;
  budgetMin: string;
  budgetMax: string;
  durationDays: number;
  createdAt: Date;
  clientId: number;
  proposalsCount: number;
  myProposalStatus: string | null;
  myProposalAmount: string | null;
}

export interface ProjectTabCounts {
  all: number;
  open: number;
  in_progress: number;
  completed: number;
}

const projectColumns = {
  id: projects.id,
  title: projects.title,
  description: projects.description,
  status: projects.status,
  budgetMin: projects.budgetMin,
  budgetMax: projects.budgetMax,
  durationDays: projects.durationDays,
  createdAt: projects.createdAt,
  clientId: projects.clientId,
};

async function countProposalsPerProject(projectIds: number[]): Promise<Map<number, number>> {
  const counts = new Map<number, number>();
  if (projectIds.length === 0) return counts;
  const rows = await db
    .select({ projectId: proposals.projectId, total: sql<number>`count(*)::int` })
    .from(proposals)
    .where(inArray(proposals.projectId, projectIds))
    .groupBy(proposals.projectId);
  for (const row of rows) counts.set(row.projectId, row.total);
  return counts;
}

export async function getDashboardProjects(userId: number, _role: UserRole, filter: ProjectTabFilter = 'all'): Promise<DashboardProjectItem[]> {
  const statusFilter = filter === 'all' ? undefined : eq(projects.status, filter);

  // Unified: جلب مشاريعي المنشورة + المشاريع التي قدمت عليها عرضاً (merge بدون تكرار)
  const ownedRows = await db
    .select(projectColumns)
    .from(projects)
    .where(statusFilter ? and(eq(projects.clientId, userId), statusFilter) : eq(projects.clientId, userId))
    .orderBy(desc(projects.createdAt))
    .limit(LIST_LIMIT);

  const proposalRows = await db
    .select({ ...projectColumns, myProposalStatus: proposals.status, myProposalAmount: proposals.amount })
    .from(proposals)
    .innerJoin(projects, eq(proposals.projectId, projects.id))
    .where(statusFilter ? and(eq(proposals.freelancerId, userId), statusFilter) : eq(proposals.freelancerId, userId))
    .orderBy(desc(proposals.createdAt))
    .limit(LIST_LIMIT);

  const ownedIds = new Set(ownedRows.map((r) => r.id));
  const proposalCounts = await countProposalsPerProject([...ownedRows.map((r) => r.id), ...proposalRows.map((r) => r.id)]);

  const merged: DashboardProjectItem[] = [
    ...ownedRows.map((row) => ({
      ...row,
      proposalsCount: proposalCounts.get(row.id) ?? 0,
      myProposalStatus: null as string | null,
      myProposalAmount: null as string | null,
    })),
    ...proposalRows
      .filter((r) => !ownedIds.has(r.id))
      .map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        budgetMin: row.budgetMin,
        budgetMax: row.budgetMax,
        durationDays: row.durationDays,
        createdAt: row.createdAt,
        clientId: row.clientId,
        proposalsCount: proposalCounts.get(row.id) ?? 0,
        myProposalStatus: row.myProposalStatus,
        myProposalAmount: row.myProposalAmount,
      })),
  ];

  merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return merged.slice(0, LIST_LIMIT);
}

export async function getDashboardProjectCounts(userId: number, _role: UserRole): Promise<ProjectTabCounts> {
  // Unified counts: owned + proposals
  const owned = await db
    .select({ status: projects.status, total: sql<number>`count(*)::int` })
    .from(projects)
    .where(eq(projects.clientId, userId))
    .groupBy(projects.status);

  const asFreelancer = await db
    .select({ status: projects.status, total: sql<number>`count(*)::int` })
    .from(proposals)
    .innerJoin(projects, eq(proposals.projectId, projects.id))
    .where(eq(proposals.freelancerId, userId))
    .groupBy(projects.status);

  const allRows = [...owned, ...asFreelancer];
  const counts: ProjectTabCounts = { all: 0, open: 0, in_progress: 0, completed: 0 };
  const seenProjectIds = new Set<number>(); // تجنب العد المكرر للتبسيط نحسب كل الحالات مجتمعة
  // لكن للتبسيط نجمع كل الصفوف (قد يضاعف المشاريع التي المستخدم مالكها وقدم عرضاً عليها — مستحيل لأن صاحب المشروع لا يمكنه تقديم عرض)
  for (const row of allRows) {
    counts.all += row.total;
    if (row.status === 'open') counts.open += row.total;
    if (row.status === 'in_progress') counts.in_progress += row.total;
    if (row.status === 'completed') counts.completed += row.total;
  }
  return counts;
}

export interface DashboardProposalItem {
  id: number;
  projectId: number;
  projectTitle: string;
  projectStatus: ProjectStatus;
  projectClientId: number;
  budgetMin: string;
  budgetMax: string;
  amount: string;
  durationDays: number;
  status: string;
  createdAt: Date;
  counterpartId: number;
  counterpartName: string;
  counterpartKycVerified: boolean;
}

export interface ProposalTabCounts {
  all: number;
  pending: number;
  accepted: number;
  rejected: number;
}

export async function getDashboardProposals(userId: number, _role: UserRole, filter: ProposalTabFilter = 'all'): Promise<DashboardProposalItem[]> {
  const statusFilter = filter === 'all' ? undefined : eq(proposals.status, filter);

  // العروض المستلمة على مشاريعي
  const received = await db
    .select({
      id: proposals.id,
      projectId: proposals.projectId,
      projectTitle: projects.title,
      projectStatus: projects.status,
      projectClientId: projects.clientId,
      budgetMin: projects.budgetMin,
      budgetMax: projects.budgetMax,
      amount: proposals.amount,
      durationDays: proposals.durationDays,
      status: proposals.status,
      createdAt: proposals.createdAt,
      counterpartId: proposals.freelancerId,
      counterpartName: users.name,
      counterpartKycVerified: users.isKycVerified,
    })
    .from(proposals)
    .innerJoin(projects, eq(proposals.projectId, projects.id))
    .innerJoin(users, eq(proposals.freelancerId, users.id))
    .where(statusFilter ? and(eq(projects.clientId, userId), statusFilter) : eq(projects.clientId, userId))
    .orderBy(desc(proposals.createdAt))
    .limit(LIST_LIMIT);

  // العروض التي قدمتها
  const sent = await db
    .select({
      id: proposals.id,
      projectId: proposals.projectId,
      projectTitle: projects.title,
      projectStatus: projects.status,
      projectClientId: projects.clientId,
      budgetMin: projects.budgetMin,
      budgetMax: projects.budgetMax,
      amount: proposals.amount,
      durationDays: proposals.durationDays,
      status: proposals.status,
      createdAt: proposals.createdAt,
      counterpartId: projects.clientId,
      counterpartName: users.name,
      counterpartKycVerified: users.isKycVerified,
    })
    .from(proposals)
    .innerJoin(projects, eq(proposals.projectId, projects.id))
    .innerJoin(users, eq(projects.clientId, users.id))
    .where(statusFilter ? and(eq(proposals.freelancerId, userId), statusFilter) : eq(proposals.freelancerId, userId))
    .orderBy(desc(proposals.createdAt))
    .limit(LIST_LIMIT);

  const merged = [...received, ...sent];
  merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return merged.slice(0, LIST_LIMIT);
}

export async function getDashboardProposalCounts(userId: number, _role: UserRole): Promise<ProposalTabCounts> {
  const received = await db
    .select({ status: proposals.status, total: sql<number>`count(*)::int` })
    .from(proposals)
    .innerJoin(projects, eq(proposals.projectId, projects.id))
    .where(eq(projects.clientId, userId))
    .groupBy(proposals.status);

  const sent = await db
    .select({ status: proposals.status, total: sql<number>`count(*)::int` })
    .from(proposals)
    .where(eq(proposals.freelancerId, userId))
    .groupBy(proposals.status);

  const allRows = [...received, ...sent];
  const counts: ProposalTabCounts = { all: 0, pending: 0, accepted: 0, rejected: 0 };
  for (const row of allRows) {
    counts.all += row.total;
    if (row.status === 'pending') counts.pending += row.total;
    if (row.status === 'accepted') counts.accepted += row.total;
    if (row.status === 'rejected') counts.rejected += row.total;
  }
  return counts;
}
