'use server';

/**
 * خدمات — Server Actions للمفضلة (Wishlist)
 * - الجدول موجود مسبقاً في schema.ts: wishlist(userId, itemType, itemId)
 * - لا تعديلات على المخطط ولا migrations.
 */

import { and, desc, eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/db';
import { projects, users, wishlist, type ProjectStatus } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';

export type WishlistItemType = 'project' | 'freelancer';

export interface WishlistProjectItem {
  id: number;
  title: string;
  status: ProjectStatus;
  budgetMin: string;
  budgetMax: string;
  createdAt: Date;
}

export interface WishlistFreelancerItem {
  id: number;
  name: string;
  avatarUrl: string | null;
  city: string | null;
  skills: string | null;
  isKycVerified: boolean;
}

export interface WishlistDashboardItems {
  projects: WishlistProjectItem[];
  freelancers: WishlistFreelancerItem[];
}

function isWishlistItemType(value: unknown): value is WishlistItemType {
  return value === 'project' || value === 'freelancer';
}

function parsePositiveId(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

function revalidateWishlistSurfaces() {
  revalidatePath('/dashboard/profile');
  revalidatePath('/projects');
  revalidatePath('/freelancers');
}

async function ensureItemExists(itemType: WishlistItemType, itemId: number): Promise<boolean> {
  if (itemType === 'project') {
    const [row] = await db.select({ id: projects.id }).from(projects).where(eq(projects.id, itemId)).limit(1);
    return Boolean(row);
  }

  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, itemId), eq(users.role, 'freelancer')))
    .limit(1);
  return Boolean(row);
}

export async function getWishlistItemIdSet(itemType: WishlistItemType): Promise<Set<number>> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return new Set();

  const rows = await db
    .select({ itemId: wishlist.itemId })
    .from(wishlist)
    .where(and(eq(wishlist.userId, currentUser.id), eq(wishlist.itemType, itemType)));

  return new Set(rows.map((row) => row.itemId));
}

export async function getMyWishlistItems(): Promise<WishlistDashboardItems> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { projects: [], freelancers: [] };

  const rows = await db
    .select({ itemType: wishlist.itemType, itemId: wishlist.itemId, createdAt: wishlist.createdAt })
    .from(wishlist)
    .where(eq(wishlist.userId, currentUser.id))
    .orderBy(desc(wishlist.createdAt), desc(wishlist.id));

  const projectIds = rows.filter((row) => row.itemType === 'project').map((row) => row.itemId);
  const freelancerIds = rows.filter((row) => row.itemType === 'freelancer').map((row) => row.itemId);

  const [projectRows, freelancerRows] = await Promise.all([
    projectIds.length > 0
      ? db
          .select({
            id: projects.id,
            title: projects.title,
            status: projects.status,
            budgetMin: projects.budgetMin,
            budgetMax: projects.budgetMax,
            createdAt: projects.createdAt,
          })
          .from(projects)
          .where(inArray(projects.id, projectIds))
      : Promise.resolve([]),
    freelancerIds.length > 0
      ? db
          .select({
            id: users.id,
            name: users.name,
            avatarUrl: users.avatarUrl,
            city: users.city,
            skills: users.skills,
            isKycVerified: users.isKycVerified,
          })
          .from(users)
          .where(and(inArray(users.id, freelancerIds), eq(users.role, 'freelancer')))
      : Promise.resolve([]),
  ]);

  const projectsById = new Map(projectRows.map((row) => [row.id, row]));
  const freelancersById = new Map(freelancerRows.map((row) => [row.id, row]));

  return {
    projects: projectIds.map((id) => projectsById.get(id)).filter((item): item is WishlistProjectItem => item !== undefined),
    freelancers: freelancerIds
      .map((id) => freelancersById.get(id))
      .filter((item): item is WishlistFreelancerItem => Boolean(item)),
  };
}

export async function toggleWishlistItem(
  itemType: WishlistItemType,
  itemId: number,
): Promise<{ success: boolean; favorited: boolean; message?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, favorited: false, message: 'سجّل دخولك أولاً' };

  const safeId = parsePositiveId(itemId);
  if (!isWishlistItemType(itemType) || !safeId) {
    return { success: false, favorited: false, message: 'عنصر المفضلة غير صالح' };
  }

  const exists = await ensureItemExists(itemType, safeId);
  if (!exists) return { success: false, favorited: false, message: 'العنصر غير موجود' };

  const [current] = await db
    .select({ id: wishlist.id })
    .from(wishlist)
    .where(and(eq(wishlist.userId, currentUser.id), eq(wishlist.itemType, itemType), eq(wishlist.itemId, safeId)))
    .limit(1);

  if (current) {
    await db.delete(wishlist).where(eq(wishlist.id, current.id));
    revalidateWishlistSurfaces();
    return { success: true, favorited: false };
  }

  try {
    await db.insert(wishlist).values({ userId: currentUser.id, itemType, itemId: safeId });
  } catch {
    // في حال ضغطين متزامنين وتفعيل unique constraint، اعتبره مضافاً.
  }

  revalidateWishlistSurfaces();
  return { success: true, favorited: true };
}

export async function removeWishlistItemAction(formData: FormData): Promise<void> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return;

  const itemType = formData.get('itemType');
  const itemId = parsePositiveId(formData.get('itemId'));
  if (!isWishlistItemType(itemType) || !itemId) return;

  await db
    .delete(wishlist)
    .where(and(eq(wishlist.userId, currentUser.id), eq(wishlist.itemType, itemType), eq(wishlist.itemId, itemId)));

  revalidateWishlistSurfaces();
}
