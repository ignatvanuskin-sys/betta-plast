import type { Metadata } from 'next';

import { CalculatorWizard } from '@/components/CalculatorWizard';
import { Breadcrumbs, BreadcrumbSchema, ContactBlock, LocalBusinessSchema } from '@/components/sections';
import { flags } from '@/lib/config';
import { PAGES } from '@/lib/pages';

export const metadata: Metadata = {
  title: PAGES.raschet.title,
  description: PAGES.raschet.description,
  alternates: { canonical: '/raschet' },
};

export const dynamic = 'force-dynamic';

export default async function RaschetPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind } = await searchParams;

  return (
    <>
      <LocalBusinessSchema />
      <BreadcrumbSchema trail={[{ href: '/', label: 'Главная' }, { label: 'Мастер расчёта' }]} />
      <Breadcrumbs trail={[{ href: '/', label: 'Главная' }, { label: 'Мастер расчёта' }]} />

      <section className="section">
        <div className="container-page grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">Мастер расчёта</h1>
            <p className="mt-4 text-ink-soft">
              Ответьте на несколько вопросов — мастер получит параметры конструкции и свяжется с вами.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-ink-soft">
              <li>Размеры можно указать примерно: точные снимет замерщик.</li>
              <li>Фото проёма поможет быстрее понять задачу.</li>
              <li>
                {flags.priceDisplay === 'off'
                  ? 'Стоимость называет менеджер после уточнения параметров или замера — мы не публикуем цены, которые не подтверждены прайсом.'
                  : 'Ориентировочный диапазон покажем сразу, точную стоимость — после замера.'}
              </li>
            </ul>
          </div>
          <div>
            <CalculatorWizard initialKind={kind} />
          </div>
        </div>
      </section>

      <ContactBlock />
    </>
  );
}
