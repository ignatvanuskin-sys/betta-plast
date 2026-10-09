/**
 * Database client.
 *
 * Production uses a standard PostgreSQL connection (`DATABASE_URL`).
 * When no URL is provided the app falls back to an in-process, file-backed
 * PGlite database so the project runs (and can be demoed) without any external
 * service. Both speak the same SQL dialect and share the same migrations, so
 * switching is a one-variable change and there is no vendor lock-in in the data.
 */
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzleNodePg, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate as migrateNodePg } from 'drizzle-orm/node-postgres/migrator';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { Pool } from 'pg';

import { database } from '../config';
import * as schema from './schema';

export type AppDb = NodePgDatabase<typeof schema>;

type DbGlobal = typeof globalThis & {
  __bettaPlastDb?: AppDb;
  __bettaPlastDbReady?: Promise<AppDb>;
};

const globalRef = globalThis as DbGlobal;

/** Absolute path of the folder that holds the generated SQL migrations. */
export const migrationsFolder = path.join(process.cwd(), 'drizzle');

function hasMigrations(): boolean {
  if (!existsSync(migrationsFolder)) return false;
  const journal = path.join(migrationsFolder, 'meta', '_journal.json');
  return existsSync(journal);
}

async function createDb(): Promise<AppDb> {
  if (database.usesPglite) {
    // PGlite does not create parent directories itself.
    const dir = path.resolve(process.cwd(), database.pgliteDir);
    mkdirSync(dir, { recursive: true });

    const client = new PGlite(dir);
    await client.waitReady;
    const db = drizzlePglite(client, { schema }) as unknown as AppDb;
    if (hasMigrations()) {
      await migratePglite(db as never, { migrationsFolder });
    } else {
      console.warn(
        '[db] каталог drizzle/ с миграциями не найден — таблицы не созданы. Запустите npm run db:generate.',
      );
    }
    return db;
  }

  const pool = new Pool({
    connectionString: database.url,
    max: 10,
    // Managed Postgres providers usually terminate TLS at the proxy.
    ssl: database.url.includes('localhost') || database.url.includes('127.0.0.1') ? undefined : { rejectUnauthorized: false },
  });
  const db = drizzleNodePg(pool, { schema });
  if (hasMigrations()) {
    await migrateNodePg(db, { migrationsFolder });
  }
  return db;
}

/**
 * Returns a lazily-initialised singleton connection. Safe to call from route
 * handlers, server components and scripts.
 */
export function getDb(): Promise<AppDb> {
  if (!globalRef.__bettaPlastDbReady) {
    globalRef.__bettaPlastDbReady = createDb()
      .then((db) => {
        globalRef.__bettaPlastDb = db;
        return db;
      })
      .catch((error) => {
        globalRef.__bettaPlastDbReady = undefined;
        throw error;
      });
  }
  return globalRef.__bettaPlastDbReady;
}

/**
 * Read-path variant of `getDb()` that never throws.
 *
 * Public pages must degrade (hide optional blocks) instead of returning a 500,
 * and the production build must not require a reachable database. Callers
 * receive `null` and fall back to their documented default.
 */
export async function tryGetDb(): Promise<AppDb | null> {
  try {
    return await getDb();
  } catch (error) {
    console.error('[db] недоступна — страница отрендерена без данных:', error instanceof Error ? error.message : error);
    return null;
  }
}

export { schema };
