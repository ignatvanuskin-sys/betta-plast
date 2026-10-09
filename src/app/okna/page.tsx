import type { Metadata } from 'next';

import { LeadForm } from '@/components/LeadForm';
import {
  Breadcrumbs,
  BreadcrumbSchema,
  ContactBlock,
  FaqBlock,
  Hero,
  LocalBusinessSchema,
  Steps,
  WhyUs,
  type FaqItem,
} from '@/components/sections';
import { PAGES } from '@/lib/pages';

export const metadata: Metadata = {
  title: PAGES.okna.title,
  description: PAGES.okna.description,
  alternates: { canonical: '/okna' },
};

const COST_FACTORS = [
  { title: 'Размер проёма', text: 'Ширина и высота: чем больше площадь, тем больше материала.' },
  { title: 'Тип открывания', text: 'Глухое окно, поворотное, поворотно-откидное или комбинированное.' },
  { title: 'Стеклопакет', text: 'Число камер и тип стекла — влияет на тепло и шум.' },
  { title: 'Фурнитура', text: 'От неё зависит плавность хода и срок службы.' },
  { title: 'Цвет профиля', text: 'Белый или ламинированный под дерево.' },
  { title: 'Монтаж и доставка', text: 'Этаж, объём работ, откосы и подоконники.' },
];

const STEPS = [
  { title: 'Заявка', text: 'Оставьте телефон или напишите в WhatsApp.' },
  { title: 'Замер', text: 'Замерщик приедет на объект и снимет размеры.' },
  { title: 'Расчёт', text: 'Назовём стоимость по фактическим размерам.' },
  { title: 'Изготовление', text: 'Окна делают по вашим размерам.' },
  { title: 'Монтаж', text: 'Установим, уберём за собой и подпишем акт.' },
];

const FAQ: FaqItem[] = [
  {
    question: 'Как понять, какое окно мне нужно?',
    answer:
      'Опишите помещение и задачу — шумная улица, холодная сторона, широкая комната. Менеджер подскажет варианты открывания и остекления, а окончательно всё решится на замере.',
  },
  {
    question: 'Сколько стоит окно?',
    answer: 'Стоимость считаем после замера: она зависит от размера, стеклопакета, фурнитуры и объёма монтажа.',
    needsManager: true,
  },
  {
    question: 'Можно ли поставить окна зимой?',
    answer: 'Уточните у менеджера — он подскажет окно для монтажа в ваших условиях.',
    needsManager: true,
  },
  {
    question: 'Делаете ли откосы, подоконники и сетки?',
    answer:
      'Перечисленные работы относятся к монтажу и обсуждаются на замере. Скажите менеджеру, что нужно, — он включит это в расчёт.',
  },
  {
    question: 'Какая гарантия на окна?',
    answer: 'Гарантия есть. Срок и условия уточняйте у менеджера — они фиксируются в договоре.',
    needsManager: true,
  },
];

export default function OknaPage() {
  return (
    <>
      <LocalBusinessSchema />
      <BreadcrumbSchema trail={[{ href: '/', label: 'Главная' }, { label: 'Пластиковые окна' }]} />
      <Breadcrumbs trail={[{ href: '/', label: 'Главная' }, { label: 'Пластиковые окна' }]} />

      <Hero
        compact
        h1="Пластиковые окна в Караганде"
        subtitle="Замер, изготовление и монтаж окон для квартир и частных домов. Стоимость называем после замера — по вашим размерам."
        primary={{ href: '/raschet?kind=window', label: 'Рассчитать окно' }}
      />

      <section className="section">
        <div className="container-page">
          <h2 className="text-2xl font-bold md:text-3xl">От чего зависит стоимость</h2>
          <p className="mt-3 max-w-2xl text-ink-soft">
            Мы не называем цену «на глаз»: одинаковые на вид окна отличаются стеклопакетом, фурнитурой и объёмом
            монтажа.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COST_FACTORS.map((factor) => (
              <div key={factor.title} className="card">
                <h3 className="font-semibold">{factor.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{factor.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Steps steps={STEPS} />

      <WhyUs
        items={[
          { title: 'Замер до расчёта', text: 'Цифры — по фактическому проёму, а не по вашим прикидкам.' },
          { title: 'Работаем с квартирами и домами', text: 'От одной створки до остекления всего дома.' },
          { title: 'Ремонт и регулировка', text: 'Если окно уже стоит — отремонтируем и отрегулируем.' },
          { title: 'Организациям', text: 'Окна и перегородки по договору, оплата через банк.' },
        ]}
      />

      <section className="section bg-surface" id="zayavka">
        <div className="container-page grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Заявка на окна</h2>
            <p className="mt-3 text-ink-soft">
              Напишите примерные размеры или просто расскажите, что нужно. Если удобно — приложите фото проёма.
            </p>
          </div>
          <div className="card">
            <LeadForm formKind="quick" defaultKind="window" showDistrict allowFiles submitLabel="Получить расчёт" />
          </div>
        </div>
      </section>

      <FaqBlock items={FAQ} />
      <ContactBlock />
    </>
  );
}
