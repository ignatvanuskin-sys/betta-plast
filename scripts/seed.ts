/**
 * Seeds the minimum data the site needs:
 *   npm run db:seed
 *
 *  - claims registry (Приложение A) — existing rows are never overwritten, so
 *    an owner's confirmation is safe to re-run the seed after;
 *  - weekly measurement rules;
 *  - calculator catalog (products / product_options);
 *  - the first admin owner, built from ADMIN_BOOTSTRAP_*;
 *  - default public settings.
 */
import { eq, sql } from 'drizzle-orm';

import { admin, defaultWorkingHours, email, telegram } from '../src/lib/config';
import { getDb } from '../src/lib/db/client';
import { claims, measurementRules, productOptions, products, settings, users } from '../src/lib/db/schema';
import { CATALOG } from '../src/lib/domain/catalog';
import { CLAIM_SEED } from '../src/lib/domain/claims-seed';
import { DEFAULT_RATING, SETTING_KEYS } from '../src/lib/domain/settings';
import { hashPassword } from '../src/lib/auth/password';

async function seedClaims() {
  const db = await getDb();
  let created = 0;
  for (const claim of CLAIM_SEED) {
    const inserted = await db
      .insert(claims)
      .values({
        key: claim.key,
        textRu: claim.textRu,
        status: claim.status,
        source: claim.source,
        questionRu: claim.questionRu,
        note: claim.note,
      })
      .onConflictDoNothing({ target: claims.key })
      .returning({ key: claims.key });
    created += inserted.length;
  }
  console.log(`[seed] claims: added ${created}, kept ${CLAIM_SEED.length - created} existing`);
}

async function seedMeasurementRules() {
  const db = await getDb();
  const existing = await db.select({ count: sql<number>`count(*)::int` }).from(measurementRules);
  if (Number(existing[0]?.count ?? 0) > 0) {
    console.log('[seed] measurement rules already present — skipped');
    return;
  }

  await db.insert(measurementRules).values(
    defaultWorkingHours.schedule.map((entry) => ({
      weekday: entry.weekday,
      startMinute: entry.startMinute,
      endMinute: entry.endMinute,
      slotMinutes: 60,
      capacity: 1,
      enabled: entry.enabled,
    })),
  );
  console.log('[seed] measurement rules created (Friday schedule confirmed; other days are a conservative default)');
}

async function seedCatalog() {
  const db = await getDb();
  const existing = await db.select({ count: sql<number>`count(*)::int` }).from(productOptions);
  if (Number(existing[0]?.count ?? 0) > 0) {
    console.log('[seed] catalog already present — skipped');
    return;
  }

  let optionCount = 0;
  for (const [kind, fields] of Object.entries(CATALOG)) {
    await db
      .insert(products)
      .values({ code: kind, titleRu: kind, kind })
      .onConflictDoNothing({ target: products.code });

    let sort = 0;
    for (const field of fields) {
      await db
        .insert(productOptions)
        .values({
          productCode: kind,
          code: field.code,
          titleRu: field.titleRu,
          type: field.type,
          choices: field.choices ?? null,
          unit: field.unit ?? null,
          required: field.required ?? false,
          sort: sort++,
        })
        .onConflictDoNothing();
      optionCount += 1;
    }
  }
  console.log(`[seed] catalog created: ${optionCount} fields`);
}

async function seedAdmin() {
  const db = await getDb();
  const existing = await db.select({ count: sql<number>`count(*)::int` }).from(users);
  if (Number(existing[0]?.count ?? 0) > 0) {
    console.log('[seed] admin users already exist — skipped');
    return;
  }

  if (!admin.bootstrapEmail || !admin.bootstrapPassword) {
    console.warn('[seed] ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD not set — no admin created');
    return;
  }
  if (admin.bootstrapPassword === 'change-me-on-first-login') {
    console.warn('[seed] bootstrap password is still the example value — change it on first login');
  }

  await db.insert(users).values({
    email: admin.bootstrapEmail.toLowerCase(),
    name: 'Владелец',
    role: 'owner',
    passwordHash: hashPassword(admin.bootstrapPassword),
    mustChangePassword: true,
  });
  console.log(`[seed] owner created: ${admin.bootstrapEmail} (пароль нужно сменить при первом входе)`);
}

async function seedSettings() {
  const db = await getDb();
  const rows = await db.select().from(settings).where(eq(settings.key, SETTING_KEYS.rating2gis)).limit(1);
  if (rows.length === 0) {
    await db.insert(settings).values({ key: SETTING_KEYS.rating2gis, value: DEFAULT_RATING });
    console.log('[seed] rating settings created from the 2GIS card (09.10.2026)');
  }
  await db
    .insert(settings)
    .values({ key: 'review_request_delay_days', value: 2 })
    .onConflictDoNothing({ target: settings.key });
}

async function main() {
  await getDb();
  await seedClaims();
  await seedMeasurementRules();
  await seedCatalog();
  await seedAdmin();
  await seedSettings();

  if (!telegram.enabled) console.log('[seed] note: TELEGRAM_BOT_TOKEN не задан — карточки заявок не будут отправляться');
  if (!email.enabled) console.log('[seed] note: email-резерв не настроен (RESEND_API_KEY / NOTIFY_EMAIL_TO)');

  console.log('[seed] done');
  process.exit(0);
}

main().catch((error) => {
  console.error('[seed] failed', error);
  process.exit(1);
});
