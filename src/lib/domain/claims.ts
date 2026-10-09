/**
 * Claims registry (§5) — the single source of truth for what may be published.
 *
 * Public pages render only rows with status = `confirmed`. Anything else either
 * gets a neutral wording or is hidden entirely; several pages are gated behind
 * a confirmed claim (see isPublishable below).
 */
import { eq } from 'drizzle-orm';

import { getDb } from '../db/client';
import { claims, type Claim } from '../db/schema';
import type { ClaimKey } from './claims-seed';

export type ClaimStatus = 'confirmed' | 'unconfirmed';
export type ClaimSource = '2gis' | 'owner' | 'reviews' | 'none';

export type PublicClaim = {
  key: string;
  textRu: string;
  status: ClaimStatus;
  source: ClaimSource;
};

export function isConfirmed(claim: Claim | undefined | null): boolean {
  return claim?.status === 'confirmed' && claim.textRu.trim() !== '';
}

/** Loads the whole registry keyed by claim key. */
export async function getClaimsMap(): Promise<Map<string, Claim>> {
  const db = await getDb();
  const rows = await db.select().from(claims);
  return new Map(rows.map((row) => [row.key, row]));
}

/** Only confirmed claims, for public rendering. */
export async function getPublicClaims(): Promise<PublicClaim[]> {
  const db = await getDb();
  const rows = await db.select().from(claims).where(eq(claims.status, 'confirmed'));
  return rows
    .filter((row) => row.textRu.trim() !== '')
    .map((row) => ({ key: row.key, textRu: row.textRu, status: 'confirmed' as const, source: row.source as ClaimSource }));
}

export async function getClaim(key: ClaimKey | string): Promise<Claim | undefined> {
  const db = await getDb();
  const rows = await db.select().from(claims).where(eq(claims.key, key)).limit(1);
  return rows[0];
}

/**
 * Convenience helper for pages: returns the confirmed text or `null`.
 * Pages must never print a claim that is not confirmed.
 */
export async function confirmedText(key: ClaimKey | string): Promise<string | null> {
  const claim = await getClaim(key);
  return isConfirmed(claim) ? claim.textRu : null;
}

export async function setClaimStatus(
  key: string,
  status: ClaimStatus,
  actor: string,
): Promise<void> {
  const db = await getDb();
  await db
    .update(claims)
    .set({
      status,
      confirmedBy: status === 'confirmed' ? actor : null,
      confirmedAt: status === 'confirmed' ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(claims.key, key));
}

export async function updateClaimText(key: string, textRu: string): Promise<void> {
  const db = await getDb();
  await db.update(claims).set({ textRu, updatedAt: new Date() }).where(eq(claims.key, key));
}

/** The owner's to-do list: everything still waiting for an answer. */
export async function getUnconfirmedClaims(): Promise<Claim[]> {
  const db = await getDb();
  return db.select().from(claims).where(eq(claims.status, 'unconfirmed'));
}
