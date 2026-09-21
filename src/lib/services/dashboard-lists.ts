/**
 * ============================================================================
 *  mnste9 — قوائم لوحة التحكم: مشاريعي وعروضي (طبقة خدمات — للخادم)
 * ============================================================================
 *  الدوال المصدَّرة:
 *   - getDashboardProjects(userId, role, filter)      : قائمة المشاريع حسب الدور.
 *   - getDashboardProjectCounts(userId, role)         : عدّادات تبويبات المشاريع.
 *   - getDashboardProposals(userId, role, filter)     : قائمة العروض حسب الدور.
 *   - getDashboardProposalCounts(userId, role)        : عدّادات تبويبات العروض.
 *
 *  دلالات حسب الدور (ضمن المخطط المجمَّد):
 *   - «مشاريعي» لصاحب العمل: المشاريع التي نشرها (clientId = userId).
 *     وللمستقل: المشاريع التي قدّم عليها عرضاً (حتى المرفوض عرضه فيها —
 *     فهي جزء من سجله المهني) مع حالة عرضه ومبلغه في كل صف.
 *   - «العروض» للمستقل: العروض التي قدّمها. ولصاحب العمل: العروض
 *     المقدَّمة على مشاريعه (مع اسم المستقل صاحب كل عرض).
 *   - المشرف (admin) يعامَل بمسار المستقل — لا يملك شيئاً فترى قوائم فارغة.
 *
 *  قرارات موثّقة — التبويبات:
 *   - تبويبات المشاريع (الكل | العروض | الجارية | المكتملة) ترشِّح بحالة
 *     المشروع: «العروض» = المشاريع المفتوحة لاستقبال العروض (open)،
 *     والملغاة (cancelled) تظهر ضمن «الكل» فقط.
 *   - تبويبات العروض (الكل | قيد الانتظار | مقبولة | مرفوضة) ترشِّح بحالة
 *     العرض، والمسحوبة (withdrawn) تظهر ضمن «الكل» فقط.
 * ============================================================================
 */

import { and, desc, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@/db';
import { projects, proposals, users } from '@/db/schema';
import type { ProjectStatus } from '@/db/schema';

/** دور المستخدم كما في قاعدة البيانات */
type UserRole = 'client' | 'freelancer' | 'admin';

/* ============================================================================
 * أنواع التبويبات والفلاتر
 * ========================================================================== */

/** فلاتر تبويبات صفحة المشاريع — القيم في معامل URL ?status= */
export type ProjectTabFilter = 'all' | 'open' | 'in_progress' | 'completed';

/** فلاتر تبويبات صفحة العروض — القيم في معامل URL ?status= */
export type ProposalTabFilter = 'all' | 'pending' | 'accepted' | 'rejected';

/** تحويل قيمة ?status= لفلتر مشاريع صالح (الافتراضي: الكل) */
export function parseProjectTab(value: string | undefined): ProjectTabFilter {
  return value === 'open' || value === 'in_progress' || value === 'completed'
    ? value
    : 'all';
}

/** تحويل قيمة ?status= لفلتر عروض صالح (الافتراضي: الكل) */
export function parseProposalTab(value: string | undefined): ProposalTabFilter {
  return value === 'pending' || value === 'accepted' || value === 'rejected'
    ? value
    : 'all';
}

/** أقصى عدد صفوف تُحمَّل في القوائم (الأحدث أولاً) */
const LIST_LIMIT = 50;

/* ============================================================================
 * مشاريعي — الأنواع
 * ========================================================================== */

export interface DashboardProjectItem {
  id: number;
  title: string;
  description: string;
  status: ProjectStatus;
  budgetMin: string;
  budgetMax: string;
  durationDays: number;
  createdAt: Date;
  /** عدد العروض المستلمة (عرض صاحب العمل) */
  proposalsCount: number;
  /** حالة عرضي على المشروع (عرض المستقل) — null إن لم يقدّم */
  myProposalStatus: string | null;
  /** مبلغ عرضي (عرض المستقل) */
  myProposalAmount: string | null;
}

/** عدّادات تبويبات المشاريع حسب الحالة */
export interface ProjectTabCounts {
  all: number;
  open: number;
  in_progress: number;
  completed: number;
}

/* ============================================================================
 * مشاريعي — الاستعلامات
 * ========================================================================== */

/** بيانات المشروع المشتركة بين الدورين */
const projectColumns = {
  id: projects.id,
  title: projects.title,
  description: projects.description,
  status: projects.status,
  budgetMin: projects.budgetMin,
  budgetMax: projects.budgetMax,
  durationDays: projects.durationDays,
  createdAt: projects.createdAt,
};

/** عدّادات العروض لمجموعة مشاريع (استعلام ثانٍ نظيف بدل Subquery) */
async function countProposalsPerProject(
  projectIds: number[],
): Promise<Map<number, number>> {
  const counts = new Map<number, number>();
  if (projectIds.length === 0) return counts;

  const rows = await db
    .select({
      projectId: proposals.projectId,
      total: sql<number>`count(*)::int`,
    })
    .from(proposals)
    .where(inArray(proposals.projectId, projectIds))
    .groupBy(proposals.projectId);

  for (const row of rows) counts.set(row.projectId, row.total);
  return counts;
}

/**
 * قائمة «مشاريعي» حسب الدور مع فلتر التبويب (الأحدث أولاً).
 *
 * صاحب العمل → مشاريعه؛ المستقل/المشرف → المشاريع التي قدّم عليها عرضاً
 * مع حالة عرضه ومبلغه.
 */
export async function getDashboardProjects(
  userId: number,
  role: UserRole,
  filter: ProjectTabFilter = 'all',
): Promise<DashboardProjectItem[]> {
  const statusFilter =
    filter === 'all' ? undefined : eq(projects.status, filter);

  if (role === 'client') {
    const rows = await db
      .select(projectColumns)
      .from(projects)
      .where(
        statusFilter
          ? and(eq(projects.clientId, userId), statusFilter)
          : eq(projects.clientId, userId),
      )
      .orderBy(desc(projects.createdAt))
      .limit(LIST_LIMIT);

    const proposalCounts = await countProposalsPerProject(
      rows.map((row) => row.id),
    );

    return rows.map((row) => ({
      ...row,
      proposalsCount: proposalCounts.get(row.id) ?? 0,
      myProposalStatus: null,
      myProposalAmount: null,
    }));
  }

  // مستقل / مشرف — المشاريع التي قدّم عليها عرضاً (عرض واحد لكل مشروع)
  const rows = await db
    .select({
      ...projectColumns,
      myProposalStatus: proposals.status,
      myProposalAmount: proposals.amount,
    })
    .from(proposals)
    .innerJoin(projects, eq(proposals.projectId, projects.id))
    .where(
      statusFilter
        ? and(eq(proposals.freelancerId, userId), statusFilter)
        : eq(proposals.freelancerId, userId),
    )
    .orderBy(desc(proposals.createdAt))
    .limit(LIST_LIMIT);

  return rows.map((row) => ({
    ...row,
    proposalsCount: 0,
  }));
}

/** عدّادات تبويبات المشاريع (كم في كل حالة) حسب الدور */
export async function getDashboardProjectCounts(
  userId: number,
  role: UserRole,
): Promise<ProjectTabCounts> {
  const rows =
    role === 'client'
      ? await db
          .select({ status: projects.status, total: sql<number>`count(*)::int` })
          .from(projects)
          .where(eq(projects.clientId, userId))
          .groupBy(projects.status)
      : await db
          .select({
            status: projects.status,
            total: sql<number>`count(*)::int`,
          })
          .from(proposals)
          .innerJoin(projects, eq(proposals.projectId, projects.id))
          .where(eq(proposals.freelancerId, userId))
          .groupBy(projects.status);

  const counts: ProjectTabCounts = { all: 0, open: 0, in_progress: 0, completed: 0 };
  for (const row of rows) {
    counts.all += row.total;
    if (row.status === 'open') counts.open += row.total;
    if (row.status === 'in_progress') counts.in_progress += row.total;
    if (row.status === 'completed') counts.completed += row.total;
    // الملغاة تُحسب ضمن «الكل» فقط
  }
  return counts;
}

/* ============================================================================
 * عروضي — الأنواع
 * ========================================================================== */

export interface DashboardProposalItem {
  /** معرّف العرض */
  id: number;
  projectId: number;
  projectTitle: string;
  projectStatus: ProjectStatus;
  budgetMin: string;
  budgetMax: string;
  /** مبلغ العرض (نص NUMERIC كما تعيده القاعدة) */
  amount: string;
  durationDays: number;
  /** حالة العرض: pending | accepted | rejected | withdrawn */
  status: string;
  createdAt: Date;
  /** الطرف الآخر: اسم صاحب المشروع (للمستقل) / اسم المستقل (لصاحب العمل) */
  counterpartId: number;
  counterpartName: string;
  /** هل الطرف الآخر موثّق الهوية (KYC) */
  counterpartKycVerified: boolean;
}

/** عدّادات تبويبات العروض حسب الحالة */
export interface ProposalTabCounts {
  all: number;
  pending: number;
  accepted: number;
  rejected: number;
}

/* ============================================================================
 * عروضي — الاستعلامات
 * ========================================================================== */

/**
 * قائمة العروض حسب الدور مع فلتر التبويب (الأحدث أولاً).
 *
 * المستقل → العروض التي قدّمها (مع صاحب كل مشروع)؛ صاحب العمل → العروض
 * المقدَّمة على مشاريعه (مع اسم المستقل صاحب كل عرض).
 */
export async function getDashboardProposals(
  userId: number,
  role: UserRole,
  filter: ProposalTabFilter = 'all',
): Promise<DashboardProposalItem[]> {
  const statusFilter =
    filter === 'all' ? undefined : eq(proposals.status, filter);

  if (role === 'client') {
    // العروض المستلمة على مشاريعي — مع اسم المستقل صاحب كل عرض
    return db
      .select({
        id: proposals.id,
        projectId: proposals.projectId,
        projectTitle: projects.title,
        projectStatus: projects.status,
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
      .where(
        statusFilter
          ? and(eq(projects.clientId, userId), statusFilter)
          : eq(projects.clientId, userId),
      )
      .orderBy(desc(proposals.createdAt))
      .limit(LIST_LIMIT);
  }

  // مستقل / مشرف — العروض التي قدّمتها مع صاحب كل مشروع
  return db
    .select({
      id: proposals.id,
      projectId: proposals.projectId,
      projectTitle: projects.title,
      projectStatus: projects.status,
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
    .where(
      statusFilter
        ? and(eq(proposals.freelancerId, userId), statusFilter)
        : eq(proposals.freelancerId, userId),
    )
    .orderBy(desc(proposals.createdAt))
    .limit(LIST_LIMIT);
}

/** عدّادات تبويبات العروض (كم في كل حالة) حسب الدور */
export async function getDashboardProposalCounts(
  userId: number,
  role: UserRole,
): Promise<ProposalTabCounts> {
  const base =
    role === 'client'
      ? db
          .select({ status: proposals.status, total: sql<number>`count(*)::int` })
          .from(proposals)
          .innerJoin(projects, eq(proposals.projectId, projects.id))
          .where(eq(projects.clientId, userId))
          .groupBy(proposals.status)
      : db
          .select({
            status: proposals.status,
            total: sql<number>`count(*)::int`,
          })
          .from(proposals)
          .where(eq(proposals.freelancerId, userId))
          .groupBy(proposals.status);

  const rows = await base;

  const counts: ProposalTabCounts = {
    all: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  };
  for (const row of rows) {
    counts.all += row.total;
    if (row.status === 'pending') counts.pending += row.total;
    if (row.status === 'accepted') counts.accepted += row.total;
    if (row.status === 'rejected') counts.rejected += row.total;
    // المسحوبة تُحسب ضمن «الكل» فقط
  }
  return counts;
}
