/**
 * ============================================================================
 *  خدمات — استعلامات المشاريع (طبقة الخدمات — للخادم فقط)
 * ============================================================================
 *  - listProjects(filters) : للتوافق القديم
 *  - listProjectsPaginated(filters) : جديد مع بحث كلمات، ميزانية min/max،
 *    حالة، ترتيب (الأحدث، الأقدم، الأعلى/الأقل ميزانية، الأقل/الأكثر عروضاً)
 *    + pagination + proposalsCount
 *  - getProjectWithClient(id)
 *  - getProjectProposals(projectId) : قائمة العروض مع بيانات المستقل
 *  - hasUserProposed(projectId, userId)
 * ============================================================================
 */

import { and, asc, count, desc, eq, gt, gte, ilike, lt, lte, or, sql, type SQL } from 'drizzle-orm';

import { db } from '@/db';
import { projectStatusEnum, projects, proposals, users } from '@/db/schema';
import type {
  BudgetFilterValue,
  ProjectCategorySlug,
  ProjectSortValue,
  ProjectStatusKey,
} from '@/lib/services/project-meta';
import { PROJECT_CATEGORIES } from '@/lib/services/project-meta';

const MAX_LISTED_PROJECTS = 100;

export type ProjectStatus = (typeof projectStatusEnum.enumValues)[number];

export interface ProjectListFilters {
  q?: string;
  category?: ProjectCategorySlug;
  budget?: BudgetFilterValue;
  budgetMin?: number;
  budgetMax?: number;
  status?: ProjectStatusKey;
  sort?: ProjectSortValue;
  page?: number;
  pageSize?: number;
}

export interface ProjectListItem {
  id: number;
  title: string;
  description: string;
  budgetMin: string;
  budgetMax: string;
  durationDays: number;
  status: ProjectStatus;
  createdAt: Date;
  clientName: string;
  proposalsCount: number;
}

export interface PaginatedProjects {
  items: ProjectListItem[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

export interface ProjectWithClient {
  id: number;
  clientId: number;
  title: string;
  description: string;
  budgetMin: string;
  budgetMax: string;
  durationDays: number;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
  clientName: string;
  clientEmail: string;
  clientCreatedAt: Date;
  clientIsKycVerified: boolean;
  proposalsCount: number;
}

export interface ProjectProposalItem {
  id: number;
  projectId: number;
  freelancerId: number;
  amount: string;
  durationDays: number;
  comment: string | null;
  status: string;
  createdAt: Date;
  freelancerName: string;
  freelancerEmail: string;
  freelancerIsKycVerified: boolean;
  freelancerSkills: string | null;
  freelancerBio: string | null;
}

function categoryStems(slug: ProjectCategorySlug): readonly string[] {
  return PROJECT_CATEGORIES.find((category) => category.slug === slug)?.stems ?? [];
}

function budgetConditions(value: BudgetFilterValue): SQL[] {
  switch (value) {
    case 'under100':
      return [lt(projects.budgetMin, '100')];
    case '100to500':
      return [lte(projects.budgetMin, '500'), gte(projects.budgetMax, '100')];
    case '500to1000':
      return [lte(projects.budgetMin, '1000'), gte(projects.budgetMax, '500')];
    case 'over1000':
      return [gt(projects.budgetMax, '1000')];
  }
}

function buildWhereConditions(filters: ProjectListFilters): SQL[] {
  const conditions: SQL[] = [];

  if (filters.q) {
    const q = `%${filters.q}%`;
    conditions.push(or(ilike(projects.title, q), ilike(projects.description, q)) as SQL);
  }

  if (filters.category) {
    const keywordConditions = categoryStems(filters.category).flatMap((stem) => [
      ilike(projects.title, `%${stem}%`),
      ilike(projects.description, `%${stem}%`),
    ]);
    if (keywordConditions.length > 0) {
      const combined = or(...keywordConditions);
      if (combined) conditions.push(combined);
    }
  }

  if (filters.budget) {
    conditions.push(...budgetConditions(filters.budget));
  }

  if (filters.budgetMin !== undefined) {
    conditions.push(gte(projects.budgetMax, filters.budgetMin.toString()));
  }
  if (filters.budgetMax !== undefined) {
    conditions.push(lte(projects.budgetMin, filters.budgetMax.toString()));
  }

  if (filters.status) {
    conditions.push(eq(projects.status, filters.status as ProjectStatus));
  }

  return conditions;
}

/* ============================================================================
 * listProjects — للتوافق القديم (يعيد مصفوفة)
 * ========================================================================== */

export async function listProjects(filters: ProjectListFilters): Promise<ProjectListItem[]> {
  const result = await listProjectsPaginated({ ...filters, page: 1, pageSize: MAX_LISTED_PROJECTS });
  return result.items;
}

/* ============================================================================
 * listProjectsPaginated — جديد مع pagination و proposalsCount
 * ========================================================================== */

export async function listProjectsPaginated(
  filters: ProjectListFilters,
): Promise<PaginatedProjects> {
  const page = filters.page && filters.page >= 1 ? filters.page : 1;
  const pageSize = filters.pageSize && filters.pageSize >= 1 && filters.pageSize <= 50 ? filters.pageSize : 12;
  const offset = (page - 1) * pageSize;

  const conditions = buildWhereConditions(filters);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // إجمالي العدد
  let total = 0;
  try {
    const [countRow] = await db
      .select({ value: count() })
      .from(projects)
      .where(whereClause);
    total = Number(countRow?.value ?? 0);
  } catch {
    total = 0;
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // ترتيب
  let orderBy: SQL[] = [];
  switch (filters.sort) {
    case 'oldest':
      orderBy = [asc(projects.createdAt), asc(projects.id)];
      break;
    case 'budget_high':
    case 'budget':
      orderBy = [desc(projects.budgetMax), desc(projects.budgetMin), desc(projects.id)];
      break;
    case 'budget_low':
      orderBy = [asc(projects.budgetMin), asc(projects.budgetMax), asc(projects.id)];
      break;
    case 'proposals_least':
      orderBy = [asc(sql`proposals_count`), desc(projects.createdAt)];
      break;
    case 'proposals_most':
      orderBy = [desc(sql`proposals_count`), desc(projects.createdAt)];
      break;
    case 'newest':
    default:
      orderBy = [desc(projects.createdAt), desc(projects.id)];
      break;
  }

  try {
    // استعلام مع count العروض عبر subquery لتجنب مشاكل group by
    const items = await db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        budgetMin: projects.budgetMin,
        budgetMax: projects.budgetMax,
        durationDays: projects.durationDays,
        status: projects.status,
        createdAt: projects.createdAt,
        clientName: users.name,
        proposalsCount: sql<number>`(SELECT COUNT(*)::int FROM proposals WHERE proposals.project_id = ${projects.id})`.as('proposals_count'),
      })
      .from(projects)
      .innerJoin(users, eq(projects.clientId, users.id))
      .where(whereClause)
      .orderBy(...(orderBy as any))
      .limit(pageSize)
      .offset(offset);

    return {
      items: items.map((r) => ({
        ...r,
        proposalsCount: Number((r as any).proposalsCount ?? 0),
      })),
      total,
      totalPages,
      page,
      pageSize,
    };
  } catch (e) {
    console.error('listProjectsPaginated failed', e);
    return { items: [], total: 0, totalPages: 1, page, pageSize };
  }
}

/* ============================================================================
 * getProjectWithClient
 * ========================================================================== */

export async function getProjectWithClient(id: number): Promise<ProjectWithClient | null> {
  try {
    const [row] = await db
      .select({
        id: projects.id,
        clientId: projects.clientId,
        title: projects.title,
        description: projects.description,
        budgetMin: projects.budgetMin,
        budgetMax: projects.budgetMax,
        durationDays: projects.durationDays,
        status: projects.status,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        clientName: users.name,
        clientEmail: users.email,
        clientCreatedAt: users.createdAt,
        clientIsKycVerified: users.isKycVerified,
      })
      .from(projects)
      .innerJoin(users, eq(projects.clientId, users.id))
      .where(eq(projects.id, id))
      .limit(1);

    if (!row) return null;

    const [countRow] = await db
      .select({ value: count() })
      .from(proposals)
      .where(eq(proposals.projectId, id));

    return { ...row, proposalsCount: Number(countRow?.value ?? 0) };
  } catch {
    return null;
  }
}

/* ============================================================================
 * getProjectProposals — قائمة العروض مع بيانات المستقل
 * ========================================================================== */

export async function getProjectProposals(projectId: number): Promise<ProjectProposalItem[]> {
  try {
    const rows = await db
      .select({
        id: proposals.id,
        projectId: proposals.projectId,
        freelancerId: proposals.freelancerId,
        amount: proposals.amount,
        durationDays: proposals.durationDays,
        comment: proposals.comment,
        status: proposals.status,
        createdAt: proposals.createdAt,
        freelancerName: users.name,
        freelancerEmail: users.email,
        freelancerIsKycVerified: users.isKycVerified,
        freelancerSkills: users.skills,
        freelancerBio: users.bio,
      })
      .from(proposals)
      .innerJoin(users, eq(proposals.freelancerId, users.id))
      .where(eq(proposals.projectId, projectId))
      .orderBy(desc(proposals.createdAt));

    return rows as ProjectProposalItem[];
  } catch {
    return [];
  }
}

/* ============================================================================
 * hasUserProposed
 * ========================================================================== */

export async function hasUserProposed(projectId: number, userId: number): Promise<boolean> {
  try {
    const [row] = await db
      .select({ id: proposals.id })
      .from(proposals)
      .where(and(eq(proposals.projectId, projectId), eq(proposals.freelancerId, userId)))
      .limit(1);
    return Boolean(row);
  } catch {
    return false;
  }
}
