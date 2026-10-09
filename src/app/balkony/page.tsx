import type { Metadata } from 'next';

import { CalculatorWizard } from '@/components/CalculatorWizard';
import {
  Breadcrumbs,
  BreadcrumbSchema,
  ContactBlock,
  FaqBlock,
  Hero,
  LocalBusinessSchema,
  Steps,
  type FaqItem,
} from '@/components/sections';
import { company } from '@/lib/config';
import { PAGES } from '@/lib/pages';

export const metadata: Metadata = {
  title: PAGES.balkony.title,
  description: PAGES.balkony.description,
  alternates: { canonical: '/balkony' },
};

const GLAZING = [
  {
    title: 'Холодное остекление',
    text: 'Защищает от ветра, пыли и осадков. Обычно дешевле — подойдёт, если балкон используется как кладовая.',
  },
  {
    title: 'Тёплое остекление',
    text: 'Ставится, если балкон планируется как жилая зона — рабочий уголок или комната отдыха. Требует утепления.',
  },
];

const WORKS = [
  { title: 'Остекление', text: 'Холодное или тёплое — выбираем вместе с вами на замере.' },
  { title: 'Утепление', text: 'Если балкон должен быть тёплым, а не просто закрытым от ветра.' },
  { title: 'Обшивка и отделка', text: 'Стены, потолок и пол доводим до аккуратного вида.' },
  { title: 'Откосы', text: 'Наружные и внутренние — чтобы не дуло и выглядело цельно.' },
  { title: 'Шкаф или стеллаж', text: 'Встроенное хранение вместо хлама на виду.' },
  { title: 'Демонтаж старого', text: 'Аккуратно разбираем старое остекление и выносим мусор.' },
];

const STEPS = [
  { title: 'Заявка', text: 'Оставьте размеры и телефон — этого достаточно.' },
  { title: 'Замер', text: 'Замерщик приедет на объект, снимет размеры и подскажет варианты.' },
  { title: 'Расчёт', text: 'Стоимость называем после замера: она зависит от размера и работ.' },
  { title: 'Изготовление', text: 'Конструкции делают по вашим размерам.' },
  { title: 'Монтаж', text: 'Установим, уберём за собой, покажем, как пользоваться.' },
];

const FAQ: FaqItem[] = [
  {
    question: 'Что входит в «балкон под ключ»?',
    answer:
      'Обычно это остекление, утепление, обшивка и откосы, иногда встроенный шкаф. Точный список зависит от вашего балкона — обсудим на замере.',
  },
  {
    question: 'Сколько стоит остеклить балкон?',
    answer:
      'Считаем после замера: цена зависит от длины и выноса, вида остекления (холодное или тёплое) и дополнительных работ.',
    needsManager: true,
  },
  {
    question: 'Тёплое или холодное остекление — что выбрать?',
    answer:
      'Если балкон будет жилым — тёплое вместе с утеплением. Если нужен только тамбур для хранения — достаточно холодного. Подскажем на месте.',
  },
  {
    question: 'Нужно ли утепление, если остекление тёплое?',
    answer: 'Да, обычно одно без другого не работает как надо. Разберём именно ваш случай на замере.',
  },
  {
    question: 'Можно ли поставить шкаф на балконе?',
    answer:
      'Да, встроенный шкаф или стеллаж делаем вместе с отделкой — так он выглядит частью балкона, а не отдельной мебелью.',
  },
  {
    question: 'Как измерить балкон самому?',
    answer:
      'Достаточно длины и ширины в метрах плюс пара фото. Точные размеры снимет замерщик — ошибиться в миллиметрах не страшно.',
  },
];

export default function BalkonyPage() {
  return (
    <>
      <LocalBusinessSchema />
      <BreadcrumbSchema trail={[{ href: '/', label: 'Главная' }, { label: 'Балконы и лоджии' }]} />
      <Breadcrumbs trail={[{ href: '/', label: 'Главная' }, { label: 'Балконы и лоджии' }]} />

      <Hero
        compact
        h1="Остекление и отделка балконов и лоджий под ключ в Караганде"
        subtitle="Остекление, утепление, обшивка, откосы и встроенный шкаф. Расскажите про свой балкон — посчитаем после замера."
        primary={{ href: '#raschet-balkona', label: 'Рассчитать балкон' }}
      />

      <section className="section">
        <div className="container-page">
          <h2 className="text-2xl font-bold md:text-3xl">Что входит в работу</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WORKS.map((item) => (
              <div key={item.title} className="card">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{item.text}</p>
              </div>
            ))}
          </div>
          <p className="hint mt-4">
            Точный перечень работ для вашего балкона подтвердит менеджер на замере: не всё нужно в каждом случае.
          </p>
        </div>
      </section>

      <section className="section bg-surface-2">
        <div className="container-page grid gap-4 sm:grid-cols-2">
          {GLAZING.map((item) => (
            <div key={item.title} className="card">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-ink-soft">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="raschet-balkona">
        <div className="container-page">
          <h2 className="text-2xl font-bold md:text-3xl">Рассчитать балкон</h2>
          <p className="mt-3 max-w-2xl text-ink-soft">
            Четыре коротких шага. Размеры можно указать примерно, а фото проёма — приложить прямо в форме.
          </p>
          <div className="mt-6">
            <CalculatorWizard initialKind="balcony" />
          </div>
          <div className="mt-8 card">
            <h3 className="font-semibold">Как измерить лоджию самому</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink-soft">
              <li>Измерьте длину балкона вдоль стены и ширину от стены до ограждения (в метрах).</li>
              <li>Запишите высоту остекления — от пола или от парапета до потолка.</li>
              <li>Сфотографируйте балкон с двух сторон и ограждение снаружи.</li>
              <li>
                Укажите этаж и есть ли лифт — от этого зависит подъём конструкций. Лифта нет? Это не проблема:
                поднимаем вручную.
              </li>
            </ol>
            <p className="hint mt-3">
              Всё равно не уверены? Ничего страшного — {company.nameRu} отправит замерщика, он снимет точные размеры.
            </p>
          </div>
        </div>
      </section>

      <Steps steps={STEPS} />

      <section className="section bg-surface">
        <div className="container-page">
          <h2 className="text-2xl font-bold md:text-3xl">Приёмка работ и акт</h2>
          <p className="mt-3 max-w-3xl text-ink-soft">
            Мы понимаем, что главные тревоги при заказе — «сделают ли аккуратно» и «не придётся ли доделывать самому».
            Поэтому порядок такой: монтаж → осмотр вместе с вами → устранение замечаний → подписание акта. Мастера
            убирают за собой и показывают, как правильно открывать и мыть окна.
          </p>
        </div>
      </section>

      <FaqBlock items={FAQ} />
      <ContactBlock />
    </>
  );
}
