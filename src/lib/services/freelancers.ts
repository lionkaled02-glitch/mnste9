/**
 * ============================================================================
 *  mnste9 — استعلامات المستقلين (طبقة الخدمات — للخادم فقط)
 * ============================================================================
 *  الدالة المصدَّرة:
 *   - listFreelancers({ search, limit }) : قائمة المستقلين مع بحث بالاسم.
 *   - getFreelancerById(id) : تفاصيل مستقل واحد (للصفحة العامة).
 *
 *  قرار موثّق — "التخصص" بلا عمود في قاعدة البيانات:
 *   جدول users (المخطط المجمَّد) لا يحتوي عمود تخصص. الحل المعتمد:
 *   يُستنتج تخصص كل مستقل من مشاريعه التي قدّم عليها عروضاً — بتطبيق
 *   نفس استنتاج التصنيفات المعتمد في المرحلة الرابعة (جذوع كلمات عربية
 *   على عنوان المشروع ووصفه)، ويُختار الأكثر تكراراً (وعند التعادل
 *   يفوز الترتيب المعتمد للتصنيفات). من لا عروض له → "تخصص غير محدد".
 *   قابل للترحيل إلى عمود حقيقي بمجرد السماح بتعديل المخطط.
 *
 *  قرار موثّق — صورة المستقل:
 *   لا توجد صور شخصيات في المخطط؛ تُعرض دائرة زمردية بحرف الاسم الأول
 *   (نفس نمط بطاقة العميل في صفحة تفاصيل المشروع).
 * ============================================================================
 */

import { desc, eq, ilike, inArray, and, type SQL } from 'drizzle-orm';

import { db } from '@/db';
import { projects, proposals, users } from '@/db/schema';
import {
  deriveCategoryLabel,
  PROJECT_CATEGORIES,
} from '@/lib/services/project-meta';

/** التخصص الافتراضي لمن لا يمكن استنتاج تخصصه */
export const UNSPECIALIZED_LABEL = 'تخصص غير محدد';

/** الحد الأقصى للمستقلين المعروضين في الصفحة الواحدة */
const MAX_LISTED_FREELANCERS = 60;

/* ============================================================================
 * الأنواع العامة للطبقة
 * ========================================================================== */

export interface FreelancerListItem {
  id: number;
  name: string;
  isKycVerified: boolean;
  createdAt: Date;
  /** مسار الصورة الشخصية المرفوعة (أو null → الحرف الأول) */
  avatarUrl: string | null;
  /** التخصص المستنتج (أو UNSPECIALIZED_LABEL) — راجع الترويسة */
  specialty: string;
}

export interface FreelancerDetail {
  id: number;
  name: string;
  email: string;
  role: string;
  isKycVerified: boolean;
  createdAt: Date;
  /** مسار الصورة الشخصية المرفوعة (أو null → الحرف الأول) */
  avatarUrl: string | null;
  phone: string | null;
  city: string | null;
  skills: string | null;
  bio: string | null;
  hourlyRate: string | null;
  specialty: string;
}

export interface ListFreelancersOptions {
  /** نص البحث بالاسم (اختياري) */
  search?: string;
}

/* ============================================================================
 * أدوات داخلية
 * ========================================================================== */

/**
 * استنتاج تخصص مستقل واحد من نصوص مشاريعه (عنوان + وصف لكل مشروع).
 * يُختار التصنيف الأكثر تكراراً؛ وعند التعادل يفوز ترتيب التصنيفات
 * المعتمد في project-meta.ts — سلوك حتمي قابل للاختبار.
 */
function deriveSpecialty(projectTexts: string[]): string {
  const tally = new Map<string, number>();
  for (const text of projectTexts) {
    const label = deriveCategoryLabel(text);
    if (label) tally.set(label, (tally.get(label) ?? 0) + 1);
  }

  let bestLabel: string | undefined;
  let bestCount = 0;
  for (const category of PROJECT_CATEGORIES) {
    const currentCount = tally.get(category.label) ?? 0;
    if (currentCount > bestCount) {
      bestLabel = category.label;
      bestCount = currentCount;
    }
  }

  return bestLabel ?? UNSPECIALIZED_LABEL;
}

/** تهريب محارف النمط (%) و(_) كي يعمل البحث حرفياً وليس كنمط ILIKE */
function escapeLikePattern(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}

/* ============================================================================
 * listFreelancers — قائمة المستقلين مع البحث بالاسم
 * ========================================================================== */

export async function listFreelancers(
  options: ListFreelancersOptions = {},
): Promise<FreelancerListItem[]> {
  const search = options.search?.trim();

  const conditions: SQL[] = [eq(users.role, 'freelancer')];
  if (search) {
    conditions.push(ilike(users.name, `%${escapeLikePattern(search)}%`));
  }

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      isKycVerified: users.isKycVerified,
      createdAt: users.createdAt,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(and(...conditions))
    .orderBy(desc(users.createdAt), desc(users.id))
    .limit(MAX_LISTED_FREELANCERS);

  if (rows.length === 0) return [];

  // نصوص المشاريع التي قدّم عليها المستقلون المعروضون — لاستنتاج التخصصات
  const proposalRows = await db
    .select({
      freelancerId: proposals.freelancerId,
      title: projects.title,
      description: projects.description,
    })
    .from(proposals)
    .innerJoin(projects, eq(proposals.projectId, projects.id))
    .where(
      inArray(
        proposals.freelancerId,
        rows.map((row) => row.id),
      ),
    );

  const textsByFreelancer = new Map<number, string[]>();
  for (const row of proposalRows) {
    const list = textsByFreelancer.get(row.freelancerId) ?? [];
    list.push(`${row.title} ${row.description}`);
    textsByFreelancer.set(row.freelancerId, list);
  }

  return rows.map((row) => ({
    ...row,
    specialty: deriveSpecialty(textsByFreelancer.get(row.id) ?? []),
  }));
}

export async function getFreelancerById(id: number): Promise<FreelancerDetail | null> {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isKycVerified: users.isKycVerified,
      createdAt: users.createdAt,
      avatarUrl: users.avatarUrl,
      phone: users.phone,
      city: users.city,
      skills: users.skills,
      bio: users.bio,
      hourlyRate: users.hourlyRate,
    })
    .from(users)
    .where(and(eq(users.id, id), eq(users.role, 'freelancer')))
    .limit(1);

  if (!user) return null;

  const proposalRows = await db
    .select({ title: projects.title, description: projects.description })
    .from(proposals)
    .innerJoin(projects, eq(proposals.projectId, projects.id))
    .where(eq(proposals.freelancerId, id));

  const texts = proposalRows.map((r) => `${r.title} ${r.description}`);

  return {
    ...user,
    specialty: deriveSpecialty(texts),
  };
}
