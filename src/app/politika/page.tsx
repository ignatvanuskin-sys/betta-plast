import type { Metadata } from 'next';

import { Breadcrumbs, BreadcrumbSchema } from '@/components/sections';
import { company, contacts } from '@/lib/config';
import { PAGES } from '@/lib/pages';

export const metadata: Metadata = {
  title: PAGES.politika.title,
  description: PAGES.politika.description,
  alternates: { canonical: '/politika' },
  robots: { index: true, follow: true },
};

/**
 * Privacy policy template.
 *
 * ПРОВЕРИТЬ ЮРИСТОМ перед публикацией (§14): текст составлен как рабочий
 * шаблон и должен быть выверен под требования законодательства РК о
 * персональных данных.
 */
export default function PolitikaPage() {
  return (
    <>
      <BreadcrumbSchema trail={[{ href: '/', label: 'Главная' }, { label: 'Политика конфиденциальности' }]} />
      <Breadcrumbs trail={[{ href: '/', label: 'Главная' }, { label: 'Политика конфиденциальности' }]} />

      <section className="section">
        <div className="container-page max-w-3xl">
          <h1 className="text-3xl font-bold md:text-4xl">Политика конфиденциальности</h1>

          <div className="mt-4 rounded-lg border border-[#f0d9c8] bg-[#fdf6f1] p-4 text-sm text-ink-soft">
            <strong>Черновик.</strong> Текст подготовлен как шаблон и должен быть проверен юристом перед публикацией —
            с учётом требований законодательства Республики Казахстан о персональных данных.
          </div>

          <h2 className="mt-8 text-xl font-bold">1. Кто мы</h2>
          <p className="mt-2 text-ink-soft">
            Оператор персональных данных — {company.nameRu}, {company.addressRu}, {company.districtRu}. Связаться можно
            по телефону {contacts.phonePrimary} или по email {contacts.email}.
          </p>

          <h2 className="mt-6 text-xl font-bold">2. Какие данные мы собираем</h2>
          <ul className="mt-2 space-y-1 text-ink-soft">
            <li>имя и телефон, которые вы указываете в форме;</li>
            <li>email, организацию, адрес объекта и комментарий — если вы их заполнили;</li>
            <li>фотографии и файлы, которые вы приложили к заявке;</li>
            <li>технические данные: источник перехода, страница заявки, тип устройства, язык.</li>
          </ul>

          <h2 className="mt-6 text-xl font-bold">3. Зачем мы их собираем</h2>
          <p className="mt-2 text-ink-soft">
            Чтобы связаться с вами по заявке, подготовить расчёт, согласовать замер и выполнить работы. Данные не
            используются для автоматических решений и не продаются третьим лицам.
          </p>

          <h2 className="mt-6 text-xl font-bold">4. Кому передаются данные</h2>
          <p className="mt-2 text-ink-soft">
            Заявки передаются сотрудникам компании через мессенджер и внутреннюю админку — это необходимо, чтобы
            обработать обращение. Также используются сервисы хостинга и базы данных. Перечень таких сервисов и правила
            доступа сотрудников описаны во внутренней документации.
          </p>

          <h2 className="mt-6 text-xl font-bold">5. Сколько храним</h2>
          <p className="mt-2 text-ink-soft">
            Данные хранятся столько, сколько нужно для работы по заявке и исполнения обязательств. Конкретный срок
            хранения закрытых обращений согласуется с юристом. По вашему запросу данные удаляются.
          </p>

          <h2 className="mt-6 text-xl font-bold">6. Cookie и аналитика</h2>
          <p className="mt-2 text-ink-soft">
            Обязательные cookie нужны для работы сайта. Аналитические счётчики и рекламные пиксели подключаются только
            после вашего согласия — до этого момента они не загружаются.
          </p>

          <h2 className="mt-6 text-xl font-bold">7. Ваши права</h2>
          <p className="mt-2 text-ink-soft">
            Вы можете отозвать согласие, запросить доступ к своим данным, их уточнение или удаление. Для этого
            позвоните по номеру {contacts.phonePrimary} или напишите на {contacts.email}.
          </p>

          <h2 className="mt-6 text-xl font-bold">8. Согласие</h2>
          <p className="mt-2 text-ink-soft">
            Отправляя форму, вы подтверждаете, что ознакомились с этой политикой и согласны на обработку персональных
            данных. Галочка согласия не отмечена по умолчанию — её нужно поставить самостоятельно. Вместе с заявкой
            сохраняются версия текста и время согласия.
          </p>
        </div>
      </section>
    </>
  );
}
