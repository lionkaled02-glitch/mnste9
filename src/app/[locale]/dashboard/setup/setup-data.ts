import 'server-only';

import { and, count, eq, inArray } from 'drizzle-orm';

import { db } from '@/db';
import { kycDocuments, portfolioItems, users } from '@/db/schema';

import { buildSetupState, type SetupProfileValues, type SetupState } from './setup-helpers';

export async function getFreelancerSetupValues(userId: number): Promise<SetupProfileValues | null> {
  const [profile] = await db
    .select({
      phone: users.phone,
      bio: users.bio,
      skills: users.skills,
      isKycVerified: users.isKycVerified,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!profile) return null;

  const [kycRow, portfolioRow] = await Promise.all([
    db
      .select({ value: count() })
      .from(kycDocuments)
      .where(and(eq(kycDocuments.userId, userId), inArray(kycDocuments.status, ['pending', 'approved']))),
    db.select({ value: count() }).from(portfolioItems).where(eq(portfolioItems.userId, userId)),
  ]);

  return {
    phone: profile.phone,
    bio: profile.bio,
    skills: profile.skills,
    isKycVerified: profile.isKycVerified,
    hasKycRequest: Number(kycRow[0]?.value ?? 0) > 0,
    portfolioCount: Number(portfolioRow[0]?.value ?? 0),
  };
}

export async function getFreelancerSetupState(userId: number): Promise<SetupState> {
  const values = await getFreelancerSetupValues(userId);
  if (!values) return { currentStep: 'phone', completedSteps: [], progress: 0 };
  return buildSetupState(values);
}
