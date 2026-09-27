import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { rateLimits } from '@/db/schema';

export async function checkRateLimit(key: string, maxAttempts: number, windowSeconds: number, blockMinutes = 15): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);
  const [existing] = await db.select().from(rateLimits).where(eq(rateLimits.key, key)).limit(1);

  if (existing?.blockedUntil && existing.blockedUntil > now) {
    return { allowed: false, retryAfter: Math.ceil((existing.blockedUntil.getTime() - now.getTime()) / 1000) };
  }

  if (!existing || existing.windowStart < windowStart) {
    await db.insert(rateLimits).values({ key, attempts: 1, windowStart: now }).onConflictDoUpdate({ target: rateLimits.key, set: { attempts: 1, windowStart: now, blockedUntil: null } });
    return { allowed: true };
  }

  if (existing.attempts >= maxAttempts) {
    const blockedUntil = new Date(now.getTime() + blockMinutes * 60 * 1000);
    await db.update(rateLimits).set({ blockedUntil }).where(eq(rateLimits.key, key));
    return { allowed: false, retryAfter: blockMinutes * 60 };
  }

  await db.update(rateLimits).set({ attempts: existing.attempts + 1 }).where(eq(rateLimits.key, key));
  return { allowed: true };
}
