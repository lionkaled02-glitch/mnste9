'use server';

import { desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { kycDocuments, users } from '@/db/schema';

export interface LatestKycDocument {
  id: number;
  userId: number;
  status: string;
  documentType: string;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PendingReviewInfo {
  userId: number;
  userName: string;
  submittedAt: Date;
  referenceNumber: string;
  kycDocument: LatestKycDocument;
}

export async function getLatestKycDocument(userId: number): Promise<LatestKycDocument | null> {
  const [doc] = await db
    .select({
      id: kycDocuments.id,
      userId: kycDocuments.userId,
      status: kycDocuments.status,
      documentType: kycDocuments.documentType,
      rejectionReason: kycDocuments.rejectionReason,
      createdAt: kycDocuments.createdAt,
      updatedAt: kycDocuments.updatedAt,
    })
    .from(kycDocuments)
    .where(eq(kycDocuments.userId, userId))
    .orderBy(desc(kycDocuments.createdAt), desc(kycDocuments.id))
    .limit(1);

  return doc ?? null;
}

export async function getPendingReviewInfo(userId: number): Promise<PendingReviewInfo | null> {
  const [user] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const latest = await getLatestKycDocument(userId);
  if (!latest || latest.status !== 'pending') return null;

  return {
    userId: user.id,
    userName: user.name,
    submittedAt: latest.createdAt,
    referenceNumber: `#KYC-${latest.createdAt.getFullYear()}-${user.id}`,
    kycDocument: latest,
  };
}
