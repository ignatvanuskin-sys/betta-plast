import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { logoutAction } from '../actions';
import { getCurrentUser, hasRole } from '@/lib/auth/session';
import { configurationWarnings } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Админка — Бетта Пласт',
  robots: { index: false, follow: false },
};

const NAV = [
  { href: '/admin', label: 'Обзор' },
  { href: '/admin/leads', label: 'Заявки' },
  { href: '/admin/measurements', label: 'Замеры' },
  { href: '/admin/claims', label: 'Утверждения' },
  { href: '/admin/gallery', label: 'Галерея' },
  { href: '/admin/notifications', label: 'Уведомления' },
  { href: '/admin/settings', label: 'Настройки' },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const warnings = configurationWarnings();

  return (
    <div className="container-page py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-bold">Админка</p>
          <p className="hint">
            {user.name || user.email} · роль: {user.role}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className="btn btn-outline py-2 text-sm">
            Открыть сайт
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="btn btn-outline py-2 text-sm">
              Выйти
            </button>
          </form>
        </div>
      </div>

      <nav className="mt-4 flex flex-wrap gap-2" aria-label="Разделы админки">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="min-h-11 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium hover:border-glass"
          >
            {item.label}
          </Link>
        ))}
        {hasRole(user, 'owner') ? null : <span className="hint self-center">часть действий доступна только владельцу</span>}
      </nav>

      {warnings.length > 0 ? (
        <details className="mt-4 rounded-lg border border-[#f0d9c8] bg-[#fdf6f1] p-3 text-sm">
          <summary className="cursor-pointer font-semibold text-warn">
            Незаполненные настройки: {warnings.length}
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-soft">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="mt-6">{children}</div>
    </div>
  );
}
