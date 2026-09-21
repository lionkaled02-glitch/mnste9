/**
 * ============================================================================
 *  mnste9 — استعلامات لوحة التحكم (طبقة الخدمات — للخادم فقط)
 * ============================================================================
 *  الدوال المصدَّرة:
 *   - getDashboardStats(userId, role) : الإحصائيات الأربع حسب الدور.
 *   - getLatestProjects(userId, role) : أحدث المشاريع (آخر 3) حسب الدور.
 *
 *  قرارات موثّقة (دلالات حسب الدور — ضمن المخطط المجمَّد):
 *   - "المشاريع النشطة":
 *       * صاحب عمل → مشاريعه المنشورة بحالة open أو in_progress.
 *       * مستقل     → المشاريع التي قدّم عليها عرضاً وما تزال نشطة
 *                      (منافساته الجارية على المنصة).
 *   - "العروض":
 *       * مستقل     → عروضه المقدمة.
 *       * صاحب عمل  → العروض المستلمة على مشاريعه (المرآة الطبيعية
 *                      للبطاقة نفسها — التسمية تتبدل في الصفحة حسب الدور).
 *   - "الرصيد المتاح" و"المحجوز في الضمان": من محفظة المستخدم
 *     (wallets.balance / pending_balance) — تُنسق بالدولار اتساقاً مع
 *     مبالغ المشاريع والعروض المعتمدة منذ المرحلة الرابعة.
 *   - "أحدث المشاريع": صاحب العمل يرى مشاريعه الأخيرة؛ المستقل يرى أحدث
 *     المشاريع المفتوحة على المنصة (فرصاً أمامه).
 *   - المشرف (admin) يعامَل بمسار المستقل — لا مشاريع ولا عروض له،
 *     فتظهر أصفاراً صادقة.
 * ============================================================================
 */

import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@/db';
import { projects, proposals, wallets } from '@/db/schema';
import type { ProjectStatus } from '@/lib/services/projects';

/** الحالات التي يُعدّ فيها المشروع "نشطاً" */
const ACTIVE_STATUSES: ProjectStatus[] = ['open', 'in_progress'];

/** دور المستخدم كما في قاعدة البيانات */
type UserRole = 'client' | 'freelancer' | 'admin';

/* ============================================================================
 * الأنواع العامة للطبقة
 * ========================================================================== */

export interface DashboardStats {
  /** المشاريع النشطة (بحسب الدور — راجع الترويسة) */
  activeProjects: number;
  /** العروض: المقدمة للمستقل / المستلمة لصاحب العمل */
  proposals: number;
  /** الرصيد المتاح في المحفظة (نص NUMERIC كما تعيده القاعدة) */
  walletBalance: string;
  /** المحتجز في الضمان المالي (نص NUMERIC كما تعيده القاعدة) */
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

/* ============================================================================
 * getDashboardStats — الإحصائيات الأربع (استعلامات متوازية)
 * ========================================================================== */

export async function getDashboardStats(
  userId: number,
  role: UserRole,
): Promise<DashboardStats> {
  const isClient = role === 'client';

  const [walletRow, activeRow, proposalsRow] = await Promise.all([
    // المحفظة — محفظة واحدة لكل مستخدم (تُنشأ مع الحساب)
    db
      .select({
        balance: wallets.balance,
        pendingBalance: wallets.pendingBalance,
      })
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1),

    // المشاريع النشطة — حسب الدور
    isClient
      ? db
          .select({ value: count() })
          .from(projects)
          .where(
            and(
              eq(projects.clientId, userId),
              inArray(projects.status, ACTIVE_STATUSES),
            ),
          )
      : db
          .select({
            value:
              sql<number>`COUNT(DISTINCT ${proposals.projectId})`.mapWith(
                Number,
              ),
          })
          .from(proposals)
          .innerJoin(projects, eq(proposals.projectId, projects.id))
          .where(
            and(
              eq(proposals.freelancerId, userId),
              inArray(projects.status, ACTIVE_STATUSES),
            ),
          ),

    // العروض — حسب الدور
    isClient
      ? db
          .select({ value: count() })
          .from(proposals)
          .innerJoin(projects, eq(proposals.projectId, projects.id))
          .where(eq(projects.clientId, userId))
      : db
          .select({ value: count() })
          .from(proposals)
          .where(eq(proposals.freelancerId, userId)),
  ]);

  return {
    activeProjects: Number(activeRow[0]?.value ?? 0),
    proposals: Number(proposalsRow[0]?.value ?? 0),
    walletBalance: walletRow[0]?.balance ?? '0.00',
    walletPendingBalance: walletRow[0]?.pendingBalance ?? '0.00',
  };
}

/* ============================================================================
 * getLatestProjects — أحدث المشاريع (آخر 3) حسب الدور
 * ========================================================================== */

export async function getLatestProjects(
  userId: number,
  role: UserRole,
  limit = 3,
): Promise<DashboardProjectItem[]> {
  const columns = {
    id: projects.id,
    title: projects.title,
    status: projects.status,
    budgetMin: projects.budgetMin,
    budgetMax: projects.budgetMax,
    durationDays: projects.durationDays,
    createdAt: projects.createdAt,
  };

  if (role === 'client') {
    // صاحب العمل: أحدث مشاريعه هو (بأي حالة)
    return db
      .select(columns)
      .from(projects)
      .where(eq(projects.clientId, userId))
      .orderBy(desc(projects.createdAt), desc(projects.id))
      .limit(limit);
  }

  // مستقل / مشرف: أحدث المشاريع المفتوحة على المنصة (الفرص المتاحة)
  return db
    .select(columns)
    .from(projects)
    .where(eq(projects.status, 'open'))
    .orderBy(desc(projects.createdAt), desc(projects.id))
    .limit(limit);
}
