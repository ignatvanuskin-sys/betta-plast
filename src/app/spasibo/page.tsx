import type { Metadata } from 'next';
import Link from 'next/link';

import { IconCheck, IconWhatsapp } from '@/components/icons';
import { TrackedLink } from '@/components/TrackedLink';
import { contacts } from '@/lib/config';
import { waDefaultText, waLink } from '@/lib/notify/messages';

export const metadata: Metadata = {
  title: 'Заявка принята — Бетта Пласт',
  description: 'Заявка принята. Мы свяжемся с вами в рабочее время.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const KIND_LABELS: Record<string, string> = {
  window: 'окно',
  balcony: 'балкон / лоджия',
  partition: 'перегородка',
  repair: 'ремонт',
  other: 'заявка',
};

export default async function SpasiboPage({
  searchParams,
}: {
  searchParams: Promise<{ form?: string; id?: string; kind?: string; repeat?: string }>;
}) {
  const { form, id, kind, repeat } = await searchParams;
  const leadId = Number.parseInt(id ?? '', 10);

  // Prefilled WhatsApp text so the visitor can continue in one tap (§8.1.6).
  const waText = waDefaultText({
    kind,
    leadId: Number.isFinite(leadId) && leadId > 0 ? leadId : undefined,
  });

  return (
    <section className="section">
      <div className="container-page max-w-2xl">
        <div className="card text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-glass-soft text-glass">
            <IconCheck size={28} />
          </span>
          <h1 className="mt-4 text-2xl font-bold md:text-3xl">
            {repeat ? 'Заявка обновлена' : 'Заявка принята'}
          </h1>
          <p className="mt-3 text-ink-soft">
            Мы свяжемся с вами в рабочее время. Хотите быстрее — напишите в WhatsApp.
          </p>

          {Number.isFinite(leadId) && leadId > 0 ? (
            <p className="mt-2 font-semibold">Номер вашей заявки: №{leadId}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <TrackedLink
              href={waLink(waText)}
              event="whatsapp_click"
              props={{ place: 'thanks', form }}
              className="btn btn-wa"
            >
              <IconWhatsapp size={20} />
              Написать в WhatsApp
            </TrackedLink>
            <a href={contacts.telHref} className="btn btn-outline">
              Позвонить {contacts.phonePrimary}
            </a>
          </div>

          <div className="mt-8 grid gap-3 text-left text-sm text-ink-soft">
            <p>
              Что дальше: менеджер посмотрит заявку{kind ? ` (${KIND_LABELS[kind] ?? kind})` : ''} и свяжется удобным
              для вас способом. Если понадобятся размеры — подскажем, как их снять.
            </p>
            <p>
              Стоимость называем после замера: она зависит от размеров и работ, поэтому «средняя цена» с сайта всё
              равно оказалась бы неточной.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/balkony" className="font-semibold text-glass underline">
              Балконы и лоджии
            </Link>
            <Link href="/okna" className="font-semibold text-glass underline">
              Пластиковые окна
            </Link>
            <Link href="/remont-okon" className="font-semibold text-glass underline">
              Ремонт окон
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
