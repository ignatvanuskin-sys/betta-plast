/**
 * Editable site settings stored in the `settings` table, so the owner can
 * change numbers from the admin panel without a redeploy.
 */
import { eq } from 'drizzle-orm';

import { getDb, tryGetDb } from '../db/client';
import { settings } from '../db/schema';

export type RatingSetting = {
  value: number;
  reviewsCount: number;
  ratingsCount: number;
  checkedAt: string;
  url: string;
};

export const SETTING_KEYS = {
  rating2gis: 'rating_2gis',
  workingHours: 'working_hours',
  measureRules: 'measure_rules',
} as const;

/** Baseline matches the 2GIS card checked on 09.10.2026 (§2). */
export const DEFAULT_RATING: RatingSetting = {
  value: 4.8,
  reviewsCount: 55,
  ratingsCount: 62,
  checkedAt: '2026-10-09',
  url: 'https://2gis.kz/karaganda/firm/11822477302933245/tab/reviews',
};

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const db = await tryGetDb();
  if (!db) return fallback;
  const rows = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  const row = rows[0];
  if (!row) return fallback;
  return row.value as T;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
}

export async function getRating(): Promise<RatingSetting> {
  return getSetting<RatingSetting>(SETTING_KEYS.rating2gis, DEFAULT_RATING);
}

/** Formats the rating strictly as third-party data with its source and date. */
export function ratingLine(rating: RatingSetting): string {
  const value = rating.value.toFixed(1).replace('.', ',');
  return `Рейтинг в 2ГИС: ${value} · ${rating.ratingsCount} оценки (по данным карточки на ${rating.checkedAt})`;
}
