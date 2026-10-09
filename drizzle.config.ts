import { defineConfig } from 'drizzle-kit';

/**
 * Migrations are generated for PostgreSQL and kept in ./drizzle.
 * They are applied to either a real Postgres (DATABASE_URL) or the in-process
 * PGlite database used for local/demo runs — both speak the same SQL dialect.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  strict: true,
  verbose: false,
});
