import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { contacts, flags } from '@/lib/config';
import { getLeadByToken } from '@/lib/domain/leads';
import { STATUS_LABELS_RU, type LeadStatus } from '@/lib/domain/statuses';
import { formatDateTimeRu } from '@/lib/domain/time';

export const metadata: Metadata = {
  title: 'Статус заказа — Бетта Пласт',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/** Client-facing order status (§6, phase 3, behind ORDER_STATUS_PAGE_ENABLED). */
export default async function StatusPage({ params }: { params: Promise<{ token: string }> }) {
  if (!flags.orderStatusPageEnabled) notFound();

  const { token } = await params;
  if (!token || token.length < 16) notFound();

  const lead = await getLeadByToken(token);
  if (!lead) notFound();

  return (
    <section className="section">
      <div className="container-page max-w-xl">
        <h1 className="text-2xl font-bold">Статус заявки №{lead.id}</h1>
        <p className="mt-2 text-ink-soft">
          {STATUS_LABELS_RU[lead.status as LeadStatus] ?? lead.status} · обновлено {formatDateTimeRu(lead.updatedAt)}
        </p>
        <p className="mt-4 text-sm text-ink-soft">
          Если статус давно не менялся — позвоните нам: {contacts.phonePrimary}.
        </p>
      </div>
    </section>
  );
}
