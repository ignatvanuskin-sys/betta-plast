/**
 * Fixed-window rate limiter backed by the database (§8.1).
 * Kept deliberately simple: one row per bucket, no Redis dependency.
 */
import { eq, sql } from 'drizzle-orm';

import { getDb } from '../db/client';
import { rateLimits } from '../db/schema';

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSeconds: number };

export async function consumeRateLimit(
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const db = await getDb();
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  const rows = await db.select().from(rateLimits).where(eq(rateLimits.bucket, bucket)).limit(1);
  const row = rows[0];

  if (!row || row.windowStart < windowStart) {
    await db
      .insert(rateLimits)
      .values({ bucket, count: 1, windowStart: now })
      .onConflictDoUpdate({ target: rateLimits.bucket, set: { count: 1, windowStart: now } });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (row.count >= limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((row.windowStart.getTime() + windowSeconds * 1000 - now.getTime()) / 1000),
    );
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  await db
    .update(rateLimits)
    .set({ count: sql`${rateLimits.count} + 1` })
    .where(eq(rateLimits.bucket, bucket));

  return { allowed: true, remaining: limit - row.count - 1, retryAfterSeconds: 0 };
}

/** Removes buckets whose window has long expired. Called from cron. */
export async function cleanupRateLimits(olderThanSeconds = 86400): Promise<void> {
  const db = await getDb();
  const cutoff = new Date(Date.now() - olderThanSeconds * 1000);
  await db.delete(rateLimits).where(sql`${rateLimits.windowStart} < ${cutoff}`);
}
