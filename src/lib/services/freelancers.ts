/**
 * ============================================================================
 *  mnste9 — استعلامات المستقلين (طبقة الخدمات — للخادم فقط)
 * ============================================================================
 */

import { and, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';

import { db } from '@/db';
import { projects, proposals, users } from '@/db/schema';
import {
  deriveCategoryLabel,
  PROJECT_CATEGORIES,
  type ProjectCategorySlug,
} from '@/lib/services/project-meta';

export const UNSPECIALIZED_LABEL = 'تخصص غير محدد';
const MAX_LISTED_FREELANCERS = 120;

export type FreelancerSortValue = 'newest' | 'oldest' | 'rate_high' | 'rate_low' | 'verified';
export type FreelancerVerifiedFilter = 'verified' | 'unverified';

export interface FreelancerListItem {
  id: number;
  name: string;
  isKycVerified: boolean;
  createdAt: Date;
  avatarUrl: string | null;
  city: string | null;
  skills: string | null;
  bio: string | null;
  hourlyRate: string | null;
  specialty: string;
}

export interface FreelancerDetail {
  id: number;
  name: string;
  email: string;
  role: string;
  isKycVerified: boolean;
  createdAt: Date;
  avatarUrl: string | null;
  phone: string | null;
  city: string | null;
  skills: string | null;
  bio: string | null;
  hourlyRate: string | null;
  specialty: string;
}

export interface ListFreelancersOptions {
  search?: string;
  specialty?: ProjectCategorySlug;
  verified?: FreelancerVerifiedFilter;
  city?: string;
  minRate?: number;
  maxRate?: number;
  sort?: FreelancerSortValue;
}

export const FREELANCER_SORT_OPTIONS: readonly { value: FreelancerSortValue; label: string }[] = [
  { value: 'newest', label: 'الأحدث انضماماً' },
  { value: 'oldest', label: 'الأقدم' },
  { value: 'verified', label: 'الموثقون أولاً' },
  { value: 'rate_high', label: 'الأعلى سعراً' },
  { value: 'rate_low', label: 'الأقل سعراً' },
];

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

function escapeLikePattern(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}

export function parseFreelancerSortParam(raw: unknown): FreelancerSortValue {
  const values = FREELANCER_SORT_OPTIONS.map((option) => option.value);
  return typeof raw === 'string' && values.includes(raw as FreelancerSortValue) ? (raw as FreelancerSortValue) : 'newest';
}

export function parseFreelancerVerifiedParam(raw: unknown): FreelancerVerifiedFilter | undefined {
  return raw === 'verified' || raw === 'unverified' ? raw : undefined;
}

export function parseFreelancerRateParam(raw: unknown): number | undefined {
  if (typeof raw !== 'string' || raw.trim() === '') return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

export function parseFreelancerTextParam(raw: unknown, max = 80): string | undefined {
  return typeof raw === 'string' && raw.trim() ? raw.trim().slice(0, max) : undefined;
}

export async function listFreelancers(options: ListFreelancersOptions = {}): Promise<FreelancerListItem[]> {
  const search = options.search?.trim();
  const city = options.city?.trim();
  const conditions: SQL[] = [eq(users.role, 'freelancer')];

  if (search) {
    const pattern = `%${escapeLikePattern(search)}%`;
    conditions.push(
      or(
        ilike(users.name, pattern),
        ilike(users.email, pattern),
        ilike(users.skills, pattern),
        ilike(users.bio, pattern),
        ilike(users.city, pattern),
      )!,
    );
  }

  if (city) conditions.push(ilike(users.city, `%${escapeLikePattern(city)}%`));
  if (options.verified === 'verified') conditions.push(eq(users.isKycVerified, true));
  if (options.verified === 'unverified') conditions.push(eq(users.isKycVerified, false));
  if (options.minRate !== undefined) conditions.push(sql`${users.hourlyRate} IS NOT NULL AND ${users.hourlyRate} >= ${options.minRate}`);
  if (options.maxRate !== undefined) conditions.push(sql`${users.hourlyRate} IS NOT NULL AND ${users.hourlyRate} <= ${options.maxRate}`);

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      isKycVerified: users.isKycVerified,
      createdAt: users.createdAt,
      avatarUrl: users.avatarUrl,
      city: users.city,
      skills: users.skills,
      bio: users.bio,
      hourlyRate: users.hourlyRate,
    })
    .from(users)
    .where(and(...conditions))
    .orderBy(desc(users.createdAt), desc(users.id))
    .limit(MAX_LISTED_FREELANCERS);

  if (rows.length === 0) return [];

  const proposalRows = await db
    .select({
      freelancerId: proposals.freelancerId,
      title: projects.title,
      description: projects.description,
    })
    .from(proposals)
    .innerJoin(projects, eq(proposals.projectId, projects.id))
    .where(inArray(proposals.freelancerId, rows.map((row) => row.id)));

  const textsByFreelancer = new Map<number, string[]>();
  for (const row of proposalRows) {
    const list = textsByFreelancer.get(row.freelancerId) ?? [];
    list.push(`${row.title} ${row.description}`);
    textsByFreelancer.set(row.freelancerId, list);
  }

  const specialtyLabel = options.specialty ? PROJECT_CATEGORIES.find((category) => category.slug === options.specialty)?.label : undefined;
  let result = rows.map((row) => ({ ...row, specialty: deriveSpecialty(textsByFreelancer.get(row.id) ?? []) }));

  if (specialtyLabel) result = result.filter((row) => row.specialty === specialtyLabel);

  switch (options.sort) {
    case 'oldest':
      result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      break;
    case 'verified':
      result.sort((a, b) => Number(b.isKycVerified) - Number(a.isKycVerified) || b.createdAt.getTime() - a.createdAt.getTime());
      break;
    case 'rate_high':
      result.sort((a, b) => Number(b.hourlyRate ?? 0) - Number(a.hourlyRate ?? 0));
      break;
    case 'rate_low':
      result.sort((a, b) => Number(a.hourlyRate ?? Number.POSITIVE_INFINITY) - Number(b.hourlyRate ?? Number.POSITIVE_INFINITY));
      break;
    case 'newest':
    default:
      result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      break;
  }

  return result.slice(0, 60);
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
    .where(eq(users.id, id))
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
