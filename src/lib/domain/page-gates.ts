/**
 * Page gating (§6): some pages may exist only after the owner confirmed the
 * underlying facts. Keeping the check in one place means a page cannot leak
 * into the menu, the sitemap or the router by accident.
 */
import { getClaimsMap } from './claims';

export async function confirmedClaimKeys(): Promise<Set<string>> {
  const claims = await getClaimsMap();
  return new Set(
    [...claims.values()].filter((claim) => claim.status === 'confirmed').map((claim) => claim.key),
  );
}

export async function isClaimConfirmed(key: string): Promise<boolean> {
  const keys = await confirmedClaimKeys();
  return keys.has(key);
}

/** True only when every listed claim is confirmed. */
export async function areAllClaimsConfirmed(keys: string[]): Promise<boolean> {
  const confirmed = await confirmedClaimKeys();
  return keys.every((key) => confirmed.has(key));
}
