import type { Metadata } from 'next';

import { MeasureForm } from '@/components/MeasureForm';
import { Breadcrumbs, BreadcrumbSchema, ContactBlock, LocalBusinessSchema } from '@/components/sections';
import { PAGES } from '@/lib/pages';

export const metadata: Metadata = {
  title: PAGES.zamer.title,
  description: PAGES.zamer.description,
  alternates: { canonical: '/zamer' },
};

export const dynamic = 'force-dynamic';

export default function ZamerPage() {
  return (
    <>
      <LocalBusinessSchema />
      <BreadcrumbSchema trail={[{ href: '/', label: 'Главная' }, { label: 'Запись на замер' }]} />
      <Breadcrumbs trail={[{ href: '/', label: 'Главная' }, { label: 'Запись на замер' }]} />

      <section className="section">
        <div className="container-page grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">Запись на замер</h1>
            <p className="mt-4 text-ink-soft">
              Выберите удобный день и время — мы подтвердим запись. Если ничего не подходит, напишите в WhatsApp: подберём
              окно вручную.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-ink-soft">
              <li>На замере замерщик снимет размеры и подскажет варианты.</li>
              <li>Стоимость называем после замера — по фактическим размерам.</li>
              <li>Условия замера (в том числе бесплатный он или нет) уточняйте у менеджера.</li>
            </ul>
          </div>
          <div className="card">
            <MeasureForm />
          </div>
        </div>
      </section>

      <ContactBlock />
    </>
  );
}
