/**
 * Price estimation (§8.2).
 *
 * IMPORTANT: the price is only ever computed when PRICE_DISPLAY=range, i.e.
 * after the owner has supplied a confirmed price list. With PRICE_DISPLAY=off
 * (the default) this module is not called at all and no price leaves the
 * server — not in the UI, not in API responses.
 *
 * The client sends configuration, never a sum. The formula itself is stored in
 * `price_rules` with a change history, so nothing is hard-coded here.
 */
import { desc, eq } from 'drizzle-orm';

import { flags } from '../config';
import { getDb } from '../db/client';
import { priceRules } from '../db/schema';

export type PriceRule = {
  basePricePerM2: number;
  kindCoef: Record<string, number>;
  optionCoef: Record<string, number>;
  installPrice: number;
  deliveryPrice: number;
};

export const DEFAULT_PRICE_RULE: PriceRule = {
  basePricePerM2: 0,
  kindCoef: {},
  optionCoef: {},
  installPrice: 0,
  deliveryPrice: 0,
};

export async function activePriceRule(): Promise<PriceRule | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(priceRules)
    .where(eq(priceRules.active, true))
    .orderBy(desc(priceRules.createdAt))
    .limit(1);
  const row = rows[0];
  if (!row || row.basePricePerM2 <= 0) return null;
  return {
    basePricePerM2: row.basePricePerM2,
    kindCoef: row.kindCoef ?? {},
    optionCoef: row.optionCoef ?? {},
    installPrice: row.installPrice,
    deliveryPrice: row.deliveryPrice,
  };
}

export type PriceEstimate = {
  from: number;
  to: number;
  currency: 'KZT';
  disclaimer: string;
};

/**
 * Returns an indicative range, or null when price display is off / no active
 * rule exists. `area` is in square metres.
 */
export async function estimatePrice(input: {
  kind: string;
  area: number;
  options?: string[];
  install?: boolean;
  delivery?: boolean;
}): Promise<PriceEstimate | null> {
  if (flags.priceDisplay !== 'range') return null;
  const rule = await activePriceRule();
  if (!rule) return null;

  const kindCoef = rule.kindCoef[input.kind] ?? 1;
  let optionCoef = 1;
  for (const option of input.options ?? []) {
    optionCoef *= rule.optionCoef[option] ?? 1;
  }

  const base = rule.basePricePerM2 * Math.max(input.area, 0) * kindCoef * optionCoef;
  const extras = (input.install ? rule.installPrice : 0) + (input.delivery ? rule.deliveryPrice : 0);
  const total = base + extras;
  if (total <= 0) return null;

  return {
    from: Math.round((total * 0.85) / 1000) * 1000,
    to: Math.round((total * 1.15) / 1000) * 1000,
    currency: 'KZT',
    disclaimer: 'Ориентировочно. Точная стоимость — после замера.',
  };
}

/** Formats a range for the UI; returns null when nothing should be shown. */
export function formatRange(estimate: PriceEstimate | null): string | null {
  if (!estimate) return null;
  const formatter = new Intl.NumberFormat('ru-RU');
  return `от ${formatter.format(estimate.from)} до ${formatter.format(estimate.to)} ₸`;
}
