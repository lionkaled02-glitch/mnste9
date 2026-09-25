'use server';

/**
 * خدمات — Server Actions للتقييمات
 * - الجدول موجود مسبقاً في schema.ts: reviews(reviewerId, reviewedId, contractId, rating, comment)
 * - لا تعديلات على المخطط ولا migrations.
 */

import { and, desc, eq, inArray, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { db } from '@/db';
import { contracts, projects, reviews, users } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';

export interface ReviewListItem {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: Date;
  contractId: number | null;
  reviewerName: string;
}

export interface PendingReviewTarget {
  contractId: number;
  reviewedId: number;
  reviewedName: string;
  projectTitle: string;
  completedAt: Date;
}

export interface ReviewsDashboardData {
  reviewsReceived: ReviewListItem[];
  reviewsGiven: ReviewListItem[];
  pendingToReview: PendingReviewTarget[];
  averageRating: number | null;
  reviewsCount: number;
}

const reviewSchema = z.object({
  contractId: z.coerce.number().int().positive(),
  reviewedId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z
    .preprocess((value) => (typeof value === 'string' && value.trim() === '' ? null : value), z.string().trim().max(1000).nullable())
    .optional(),
});

function revalidateReviewSurfaces() {
  revalidatePath('/dashboard/profile');
  revalidatePath('/freelancers');
}

export async function getMyReviewsDashboard(): Promise<ReviewsDashboardData> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { reviewsReceived: [], reviewsGiven: [], pendingToReview: [], averageRating: null, reviewsCount: 0 };
  }

  const [receivedRows, givenRows, completedContracts] = await Promise.all([
    db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        contractId: reviews.contractId,
        reviewerId: reviews.reviewerId,
      })
      .from(reviews)
      .where(eq(reviews.reviewedId, currentUser.id))
      .orderBy(desc(reviews.createdAt), desc(reviews.id))
      .limit(20),
    db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        contractId: reviews.contractId,
        reviewerId: reviews.reviewedId,
      })
      .from(reviews)
      .where(eq(reviews.reviewerId, currentUser.id))
      .orderBy(desc(reviews.createdAt), desc(reviews.id))
      .limit(20),
    db
      .select({
        id: contracts.id,
        projectId: contracts.projectId,
        clientId: contracts.clientId,
        freelancerId: contracts.freelancerId,
        updatedAt: contracts.updatedAt,
      })
      .from(contracts)
      .where(
        and(
          eq(contracts.status, 'completed'),
          or(eq(contracts.clientId, currentUser.id), eq(contracts.freelancerId, currentUser.id)),
        ),
      )
      .orderBy(desc(contracts.updatedAt), desc(contracts.id))
      .limit(20),
  ]);

  const reviewerIds = [...new Set([...receivedRows.map((row) => row.reviewerId), ...givenRows.map((row) => row.reviewerId)])];
  const contractIds = completedContracts.map((row) => row.id);
  const projectIds = [...new Set(completedContracts.map((row) => row.projectId))];
  const counterpartIds = [
    ...new Set(
      completedContracts.map((row) => (row.clientId === currentUser.id ? row.freelancerId : row.clientId)),
    ),
  ];

  const [reviewers, alreadyReviewedRows, projectRows, counterpartRows] = await Promise.all([
    reviewerIds.length > 0
      ? db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, reviewerIds))
      : Promise.resolve([]),
    contractIds.length > 0
      ? db
          .select({ contractId: reviews.contractId })
          .from(reviews)
          .where(and(eq(reviews.reviewerId, currentUser.id), inArray(reviews.contractId, contractIds)))
      : Promise.resolve([]),
    projectIds.length > 0
      ? db.select({ id: projects.id, title: projects.title }).from(projects).where(inArray(projects.id, projectIds))
      : Promise.resolve([]),
    counterpartIds.length > 0
      ? db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, counterpartIds))
      : Promise.resolve([]),
  ]);

  const reviewersById = new Map(reviewers.map((row) => [row.id, row.name]));
  const projectsById = new Map(projectRows.map((row) => [row.id, row.title]));
  const usersById = new Map(counterpartRows.map((row) => [row.id, row.name]));
  const reviewedContractIds = new Set(alreadyReviewedRows.map((row) => row.contractId).filter((id): id is number => id !== null));

  const reviewsReceived: ReviewListItem[] = receivedRows.map((row) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt,
    contractId: row.contractId,
    reviewerName: reviewersById.get(row.reviewerId) ?? 'مستخدم',
  }));

  const reviewsGiven: ReviewListItem[] = givenRows.map((row) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt,
    contractId: row.contractId,
    reviewerName: reviewersById.get(row.reviewerId) ?? 'مستخدم',
  }));

  const pendingToReview: PendingReviewTarget[] = completedContracts
    .filter((row) => !reviewedContractIds.has(row.id))
    .map((row) => {
      const reviewedId = row.clientId === currentUser.id ? row.freelancerId : row.clientId;
      return {
        contractId: row.id,
        reviewedId,
        reviewedName: usersById.get(reviewedId) ?? 'مستخدم',
        projectTitle: projectsById.get(row.projectId) ?? `عقد #${row.id}`,
        completedAt: row.updatedAt,
      };
    });

  const averageRating =
    reviewsReceived.length > 0
      ? reviewsReceived.reduce((sum, row) => sum + row.rating, 0) / reviewsReceived.length
      : null;

  return {
    reviewsReceived,
    reviewsGiven,
    pendingToReview,
    averageRating,
    reviewsCount: reviewsReceived.length,
  };
}

export async function submitReviewAction(formData: FormData): Promise<void> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return;

  const parsed = reviewSchema.safeParse({
    contractId: formData.get('contractId'),
    reviewedId: formData.get('reviewedId'),
    rating: formData.get('rating'),
    comment: formData.get('comment'),
  });
  if (!parsed.success) return;

  const { contractId, reviewedId, rating, comment } = parsed.data;

  const [contract] = await db
    .select({
      id: contracts.id,
      clientId: contracts.clientId,
      freelancerId: contracts.freelancerId,
      status: contracts.status,
    })
    .from(contracts)
    .where(eq(contracts.id, contractId))
    .limit(1);

  if (!contract || contract.status !== 'completed') return;
  const isParticipant = contract.clientId === currentUser.id || contract.freelancerId === currentUser.id;
  const expectedReviewedId = contract.clientId === currentUser.id ? contract.freelancerId : contract.clientId;
  if (!isParticipant || reviewedId !== expectedReviewedId || reviewedId === currentUser.id) return;

  const [existing] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.reviewerId, currentUser.id), eq(reviews.contractId, contractId)))
    .limit(1);
  if (existing) return;

  await db.insert(reviews).values({
    reviewerId: currentUser.id,
    reviewedId,
    contractId,
    rating,
    comment: comment ?? null,
  });

  revalidateReviewSurfaces();
}
