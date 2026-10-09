/**
 * Applies the SQL migrations from ./drizzle to the configured database.
 *   npm run db:migrate
 *
 * With no DATABASE_URL it migrates the local PGlite database in .data/pglite,
 * so the project can be started without any external service.
 */
import { database, site } from '../src/lib/config';
import { getDb, migrationsFolder } from '../src/lib/db/client';

async function main() {
  console.log(`[migrate] timezone=${site.timezone}`);
  console.log(`[migrate] driver=${database.usesPglite ? 'pglite (local)' : 'postgres'}`);
  console.log(`[migrate] folder=${migrationsFolder}`);

  await getDb();
  console.log('[migrate] done');
  process.exit(0);
}

main().catch((error) => {
  console.error('[migrate] failed', error);
  process.exit(1);
});
