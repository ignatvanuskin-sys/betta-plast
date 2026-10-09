import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  Breadcrumbs,
  BreadcrumbSchema,
  ContactBlock,
  FaqBlock,
  LocalBusinessSchema,
  type FaqItem,
} from '@/components/sections';
import { contacts } from '@/lib/config';
import { areAllClaimsConfirmed } from '@/lib/domain/page-gates';
import { PAGES } from '@/lib/pages';

export const metadata: Metadata = {
  title: PAGES['oplata-rassrochka'].title,
  description: PAGES['oplata-rassrochka'].description,
  alternates: { canonical: '/oplata-rassrochka' },
};

export const dynamic = 'force-dynamic';

/**
 * This page is published only once the owner has confirmed the terms (§6).
 * Until then it returns a 404 and is absent from the menu and the sitemap.
 */
export default async function OplataPage() {
  const confirmed = await areAllClaimsConfirmed(['installment_terms', 'warranty_terms']);
  if (!confirmed) notFound();

  const FAQ: FaqItem[] = [
    {
      question: 'Как оформить рассрочку?',
      answer: 'Порядок оформления менеджер подтвердит при расчёте — зависеть он будет от суммы заказа.',
      needsManager: true,
    },
    {
      question: 'Какая гарантия и на что именно?',
      answer: 'Гарантия есть. Срок и условия на конструкции и отдельно на монтаж — у менеджера, они фиксируются в договоре.',
      needsManager: true,
    },
  ];

  return (
    <>
      <LocalBusinessSchema />
      <BreadcrumbSchema trail={[{ href: '/', label: 'Главная' }, { label: 'Оплата и рассрочка' }]} />
      <Breadcrumbs trail={[{ href: '/', label: 'Главная' }, { label: 'Оплата и рассрочка' }]} />

      <section className="section">
        <div className="container-page max-w-3xl">
          <h1 className="text-3xl font-bold md:text-4xl">Оплата, рассрочка и гарантия</h1>
          <p className="mt-4 text-ink-soft">
            Сейчас в карточке компании указаны способы оплаты: наличный расчёт, оплата через банк и оплата по QR-коду.
            Также компания указывает наличие рассрочки и гарантии.
          </p>
          <p className="mt-4 text-ink-soft">
            Точные условия рассрочки и срок гарантии уточняйте у менеджера — они зависят от заказа и фиксируются в
            договоре. Телефон: {contacts.phonePrimary}.
          </p>
        </div>
      </section>

      <FaqBlock items={FAQ} />
      <ContactBlock />
    </>
  );
}
