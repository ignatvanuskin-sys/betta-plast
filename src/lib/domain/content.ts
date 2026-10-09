/**
 * Public content that the owner controls from the admin panel: gallery items
 * and curated reviews. Empty results must hide the block, never fill it with
 * placeholder material (§7.1/§7.6).
 */
import { and, asc, eq } from 'drizzle-orm';

import { tryGetDb } from '../db/client';
import { galleryItems, reviewsCurated } from '../db/schema';

export type GalleryEntry = {
  id: number;
  url: string;
  beforeUrl: string | null;
  category: string;
  caption: string;
  width: number;
  height: number;
};

export async function getGallery(options: { onlyHome?: boolean; limit?: number } = {}): Promise<GalleryEntry[]> {
  const db = await tryGetDb();
  if (!db) return [];
  const conditions = [eq(galleryItems.active, true)];
  if (options.onlyHome) conditions.push(eq(galleryItems.showOnHome, true));

  const rows = await db
    .select()
    .from(galleryItems)
    .where(and(...conditions))
    .orderBy(asc(galleryItems.sort), asc(galleryItems.id))
    .limit(options.limit ?? 60);

  return rows.map((row) => ({
    id: row.id,
    url: row.url,
    beforeUrl: row.beforeUrl,
    category: row.category,
    caption: row.caption,
    width: row.width,
    height: row.height,
  }));
}

export type CuratedReview = {
  id: number;
  author: string;
  text: string;
  sourceUrl: string | null;
};

/**
 * Verbatim quotes are shown only when BOTH the owner approved them and the
 * review author's consent is recorded (§7.6).
 */
export async function getApprovedReviewQuotes(): Promise<CuratedReview[]> {
  const db = await tryGetDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(reviewsCurated)
    .where(and(eq(reviewsCurated.approved, true), eq(reviewsCurated.consent, true)))
    .orderBy(asc(reviewsCurated.sort), asc(reviewsCurated.id));

  return rows.map((row) => ({
    id: row.id,
    author: row.author,
    text: row.text,
    sourceUrl: row.sourceUrl,
  }));
}

/** Themes that clients repeatedly mention — a paraphrase, never a quotation. */
export const REVIEW_THEMES = [
  { title: 'Балконы под ключ', text: 'Остекление, утепление, обшивка, откосы и шкаф — клиенты чаще всего заказывают именно балкон.' },
  { title: 'Цена', text: 'Отмечают приятную цену и соотношение «цена — качество».' },
  { title: 'Сроки', text: 'Пишут, что работы сделали в срок, иногда раньше.' },
  { title: 'Аккуратный монтаж', text: 'Мастера убирают за собой и объясняют, как пользоваться окнами.' },
  { title: 'Замер', text: 'Замерщик приезжал быстро, стоимость называли после замера.' },
  { title: 'Консультации', text: 'Менеджеры подробно объясняют и быстро присылают эскиз.' },
  { title: 'Ремонт', text: 'Чинят балконные двери и регулируют окна, в том числе после других мастеров.' },
  { title: 'Организации', text: 'Компании заказывают окна и перегородки и работают годами.' },
] as const;
