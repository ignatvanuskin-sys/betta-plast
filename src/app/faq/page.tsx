import type { Metadata } from 'next';

import {
  Breadcrumbs,
  BreadcrumbSchema,
  ContactBlock,
  FaqBlock,
  FaqSchema,
  LocalBusinessSchema,
} from '@/components/sections';
import { FAQ_ITEMS } from '@/lib/content/faq';
import { PAGES } from '@/lib/pages';

export const metadata: Metadata = {
  title: PAGES.faq.title,
  description: PAGES.faq.description,
  alternates: { canonical: '/faq' },
};

export default function FaqPage() {
  return (
    <>
      <LocalBusinessSchema />
      <FaqSchema items={FAQ_ITEMS} />
      <BreadcrumbSchema trail={[{ href: '/', label: 'Главная' }, { label: 'Вопросы и ответы' }]} />
      <Breadcrumbs trail={[{ href: '/', label: 'Главная' }, { label: 'Вопросы и ответы' }]} />

      <section className="section">
        <div className="container-page max-w-3xl">
          <h1 className="text-3xl font-bold md:text-4xl">Вопросы и ответы</h1>
          <p className="mt-4 text-ink-soft">
            Отвечаем коротко и честно. Если ответа нет — значит, вопрос пока не подтверждён владельцем, и точнее всего
            ответит менеджер.
          </p>
        </div>
      </section>

      <FaqBlock items={FAQ_ITEMS} />
      <ContactBlock />
    </>
  );
}
