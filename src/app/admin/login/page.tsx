import type { Metadata } from 'next';

import { loginAction } from '../actions';
import { ActionForm } from '@/components/admin/ActionForm';
import { admin } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Вход в админку — Бетта Пласт',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <section className="section">
      <div className="container-page max-w-md">
        <h1 className="text-2xl font-bold">Админка Бетта Пласт</h1>
        <p className="mt-2 text-ink-soft">Войдите, чтобы видеть заявки и управлять сайтом.</p>

        {admin.isEphemeralSecret ? (
          <p className="mt-4 rounded-lg border border-[#f0d9c8] bg-[#fdf6f1] p-3 text-sm text-warn">
            Не задан SESSION_SECRET — сессии работают на небезопасном значении по умолчанию. Задайте переменную перед
            публикацией сайта.
          </p>
        ) : null}

        <div className="card mt-6">
          <ActionForm action={loginAction} submitLabel="Войти">
            <input type="hidden" name="next" value={next ?? ''} />
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                className="field"
                required
              />
            </div>
            <div className="mt-4">
              <label className="label" htmlFor="password">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="field"
                required
              />
            </div>
          </ActionForm>
        </div>
        <p className="hint mt-4">
          Первый владелец создаётся из ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD при первичной настройке (см.
          README).
        </p>
      </div>
    </section>
  );
}
