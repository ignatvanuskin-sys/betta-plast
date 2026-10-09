/**
 * Admin authentication (§9): email + password, httpOnly cookie sessions stored
 * in the database, brute-force protection and role checks.
 */
import { randomBytes } from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import { cookies } from 'next/headers';

import { admin } from '../config';
import { getDb } from '../db/client';
import { sessions, users, type User } from '../db/schema';
import { consumeRateLimit } from '../domain/ratelimit';
import { hashPassword, verifyPassword } from './password';

export { hashPassword, verifyPassword };

export type Role = 'owner' | 'manager' | 'viewer';

export type SessionUser = Pick<User, 'id' | 'email' | 'name' | 'role' | 'mustChangePassword'>;

const LOGIN_ATTEMPT_LIMIT = 10;
const LOGIN_WINDOW_SECONDS = 3600;

export async function createSession(userId: number): Promise<string> {
  const db = await getDb();
  const id = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + admin.sessionTtlHours * 3600_000);
  await db.insert(sessions).values({ id, userId, expiresAt });
  const store = await cookies();
  store.set(admin.sessionCookie, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
  return id;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const id = store.get(admin.sessionCookie)?.value;
  if (id) {
    const db = await getDb();
    await db.delete(sessions).where(eq(sessions.id, id));
  }
  store.delete(admin.sessionCookie);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const id = store.get(admin.sessionCookie)?.value;
  if (!id) return null;

  const db = await getDb();
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      mustChangePassword: users.mustChangePassword,
      active: users.active,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const row = rows[0];
  if (!row || !row.active) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    mustChangePassword: row.mustChangePassword,
  };
}

export type LoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: string };

export async function login(email: string, password: string): Promise<LoginResult> {
  const normalized = email.trim().toLowerCase();
  const limit = await consumeRateLimit(`login:${normalized}`, LOGIN_ATTEMPT_LIMIT, LOGIN_WINDOW_SECONDS);
  if (!limit.allowed) {
    return { ok: false, error: 'Слишком много попыток входа. Попробуйте позже.' };
  }

  const db = await getDb();
  const rows = await db.select().from(users).where(eq(users.email, normalized)).limit(1);
  const user = rows[0];
  if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
    return { ok: false, error: 'Неверный email или пароль' };
  }

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await createSession(user.id);
  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      mustChangePassword: user.mustChangePassword,
    },
  };
}

export async function changePassword(userId: number, newPassword: string): Promise<void> {
  const db = await getDb();
  await db
    .update(users)
    .set({ passwordHash: hashPassword(newPassword), mustChangePassword: false })
    .where(eq(users.id, userId));
}

const ROLE_RANK: Record<Role, number> = { viewer: 0, manager: 1, owner: 2 };

export function hasRole(user: SessionUser | null, required: Role): boolean {
  if (!user) return false;
  const rank = ROLE_RANK[(user.role as Role) ?? 'viewer'];
  return rank >= ROLE_RANK[required];
}

/** Guard for route handlers: returns the user or throws a 401-shaped error. */
export async function requireAdmin(required: Role = 'viewer'): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user || !hasRole(user, required)) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}
