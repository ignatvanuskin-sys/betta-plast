import type { Metadata } from 'next';

import { GalleryGrid } from '@/components/Gallery';
import { Breadcrumbs, BreadcrumbSchema, CtaBlock, LocalBusinessSchema } from '@/components/sections';
import { getGallery } from '@/lib/domain/content';
import { PAGES } from '@/lib/pages';

export const metadata: Metadata = {
  title: PAGES.raboty.title,
  description: PAGES.raboty.description,
  alternates: { canonical: '/raboty' },
};

export const dynamic = 'force-dynamic';

export default async function RabotyPage() {
  const items = await getGallery({ limit: 60 });

  return (
    <>
      <LocalBusinessSchema />
      <BreadcrumbSchema trail={[{ href: '/', label: 'Главная' }, { label: 'Наши работы' }]} />
      <Breadcrumbs trail={[{ href: '/', label: 'Главная' }, { label: 'Наши работы' }]} />

      <section className="section">
        <div className="container-page">
          <h1 className="text-3xl font-bold md:text-4xl">Наши работы</h1>
          <p className="mt-4 max-w-2xl text-ink-soft">
            Фотографии объектов: окна, балконы и лоджии, перегородки, ремонт. Показываем только настоящие работы.
          </p>

          {items.length > 0 ? (
            <div className="mt-8">
              <GalleryGrid items={items} />
            </div>
          ) : (
            <div className="mt-8 card">
              <h2 className="font-semibold">Фотографии готовятся к публикации</h2>
              <p className="mt-2 text-ink-soft">
                Мы не ставим на сайт чужие и стоковые фото: галерея появится, когда владелец загрузит снимки своих
                объектов. А пока посмотрите отзывы клиентов в 2ГИС — там есть фотографии работ.
              </p>
            </div>
          )}
        </div>
      </section>

      <CtaBlock
        title="Хотите так же?"
        text="Опишите, что нужно, — менеджер свяжется и подскажет варианты."
        formKind="quick"
      />
    </>
  );
}
