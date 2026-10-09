/**
 * Database client.
 *
 * Production uses a standard PostgreSQL connection (`DATABASE_URL`).
 * When no URL is provided the app falls back to an in-process, file-backed
 * PGlite database so the project runs (and can be demoed) without any external
 * service. Both speak the same SQL dialect and share the same migrations, so
 * switching is a one-variable change and there is no vendor lock-in in the data.
 */
import { existsSync } from 'node:fs';
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
    const client = new PGlite(database.pgliteDir);
    await client.waitReady;
    const db = drizzlePglite(client, { schema }) as unknown as AppDb;
    if (hasMigrations()) {
      await migratePglite(db as never, { migrationsFolder });
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

export { schema };
