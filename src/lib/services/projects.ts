/**
 * ============================================================================
 *  mnste9 — استعلامات المشاريع (طبقة الخدمات — للخادم فقط)
 * ============================================================================
 *  الدوال المصدَّرة:
 *   - listProjects(filters)            : قائمة المشاريع مع فلترة وترتيب.
 *   - getProjectWithClient(id)         : مشروع واحد + بيانات العميل + عدد العروض.
 *   - hasUserProposed(projectId, userId): هل قدّم المستخدم عرضاً على المشروع؟
 *
 *  مبادئ التصميم:
 *   - هذا الملف يستورد قاعدة البيانات (pg/Drizzle) — لا يُستورد أبداً من
 *     مكوّنات العميل؛ الثوابت الآمنة للعميل في project-meta.ts.
 *   - فلترة التصنيف بمطابقة جذوع كلمات (ILIKE) على العنوان والوصف —
 *     لا يوجد عمود category في المخطط المجمَّد (راجع ترويسة project-meta.ts).
 *   - فلترة الميزانية بدلالة التقاطع: يظهر المشروع إن تقاطع نطاق ميزانيته
 *     [budget_min, budget_max] مع النطاق المختار.
 *   - حد أعلى للنتائج (MAX_LISTED_PROJECTS) لحماية الصفحة من النمو غير
 *     المحدود — لا يوجد ترقيم صفحات في هذه المرحلة.
 * ============================================================================
 */

import { and, count, desc, eq, gt, gte, ilike, lt, lte, or, type SQL } from 'drizzle-orm';

import { db } from '@/db';
import { projectStatusEnum, projects, proposals, users } from '@/db/schema';
import type {
  BudgetFilterValue,
  ProjectCategorySlug,
  ProjectSortValue,
} from '@/lib/services/project-meta';
import { PROJECT_CATEGORIES } from '@/lib/services/project-meta';

/** الحد الأقصى للمشاريع المعروضة في الصفحة الواحدة */
const MAX_LISTED_PROJECTS = 100;

/** نوع حالة المشروع كما تعيده قاعدة البيانات (project_status_enum) */
export type ProjectStatus = (typeof projectStatusEnum.enumValues)[number];

/* ============================================================================
 * الأنواع العامة للطبقة
 * ========================================================================== */

export interface ProjectListFilters {
  category?: ProjectCategorySlug;
  budget?: BudgetFilterValue;
  sort?: ProjectSortValue;
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
  clientName: string;
  clientCreatedAt: Date;
  clientIsKycVerified: boolean;
  proposalsCount: number;
}

/* ============================================================================
 * أدوات داخلية
 * ========================================================================== */

/** جذوع الكلمات المطابقة لتصنيف معيّن */
function categoryStems(slug: ProjectCategorySlug): readonly string[] {
  return PROJECT_CATEGORIES.find((category) => category.slug === slug)?.stems ?? [];
}

/** شروط فلترة الميزانية بدلالة التقاطع مع [budget_min, budget_max] */
function budgetConditions(value: BudgetFilterValue): SQL[] {
  switch (value) {
    case 'under100':
      // النطاق [0, 100) — يكفي أن يبدأ المشروع تحت 100
      return [lt(projects.budgetMin, '100')];
    case '100to500':
      return [lte(projects.budgetMin, '500'), gte(projects.budgetMax, '100')];
    case '500to1000':
      return [lte(projects.budgetMin, '1000'), gte(projects.budgetMax, '500')];
    case 'over1000':
      // النطاق (1000, ∞) — يكفي أن تنتهي ميزانية المشروع فوق 1000
      return [gt(projects.budgetMax, '1000')];
  }
}

/* ============================================================================
 * listProjects — قائمة المشاريع مع الفلاتر والترتيب
 * ========================================================================== */

export async function listProjects(
  filters: ProjectListFilters,
): Promise<ProjectListItem[]> {
  const conditions: SQL[] = [];

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

  const orderBy =
    filters.sort === 'budget'
      ? [desc(projects.budgetMax), desc(projects.budgetMin), desc(projects.id)]
      : [desc(projects.createdAt), desc(projects.id)];

  return db
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
    })
    .from(projects)
    .innerJoin(users, eq(projects.clientId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(...orderBy)
    .limit(MAX_LISTED_PROJECTS);
}

/* ============================================================================
 * getProjectWithClient — مشروع واحد مع بيانات العميل وعدد العروض
 * ========================================================================== */

export async function getProjectWithClient(
  id: number,
): Promise<ProjectWithClient | null> {
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
      clientName: users.name,
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
}

/* ============================================================================
 * hasUserProposed — هل قدّم المستخدم عرضاً على المشروع؟
 * (قيد UNIQUE على (project_id, freelancer_id) — عرض واحد لكل مستقل)
 * ========================================================================== */

export async function hasUserProposed(
  projectId: number,
  userId: number,
): Promise<boolean> {
  const [row] = await db
    .select({ id: proposals.id })
    .from(proposals)
    .where(
      and(eq(proposals.projectId, projectId), eq(proposals.freelancerId, userId)),
    )
    .limit(1);

  return Boolean(row);
}
