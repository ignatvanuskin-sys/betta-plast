import Link from 'next/link';

import { IconClock, IconMail, IconPhone, IconPin } from './icons';
import { TrackedLink } from './TrackedLink';
import { company, contacts, defaultWorkingHours, flags } from '@/lib/config';
import { ratingLine, getRating } from '@/lib/domain/settings';

export type FooterLink = { href: string; label: string };

function formatMinutes(minutes: number): string {
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Dark footer closing the page, matching the reference's final section.
 * Legal-entity details are printed only when the owner has allowed it (§7.1) —
 * the claims registry decides, not this component.
 */
export async function SiteFooter({ pages, legalEntity }: { pages: FooterLink[]; legalEntity?: string | null }) {
  const rating = await getRating();
  const friday = defaultWorkingHours.schedule.find((entry) => entry.weekday === 5);

  return (
    <footer className="bg-primary text-primary-fg">
      <div className="container-page grid gap-10 py-16 lg:grid-cols-[1.2fr_1fr_1fr] lg:gap-12 lg:py-20">
        <div>
          <p className="text-xl font-semibold tracking-tight">{company.nameRu}</p>
          <p className="mt-2 text-sm leading-relaxed text-primary-fg/70">{company.taglineRu}</p>

          <p className="mt-6 text-sm text-primary-fg/85">{ratingLine(rating)}</p>
          <a
            href={contacts.gisReviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block border-b border-gold-light/60 pb-0.5 text-sm font-medium text-gold-light"
          >
            Все отзывы в 2ГИС
          </a>
        </div>

        <div>
          <p className="eyebrow eyebrow-on-dark">Контакты</p>
          <ul className="mt-4 space-y-3.5 text-sm text-primary-fg/85">
            <li className="flex items-start gap-3">
              <IconPin size={17} className="mt-0.5 shrink-0 text-gold-light" />
              <span>
                {company.addressRu}
                <br />
                {company.districtRu}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <IconPhone size={17} className="shrink-0 text-gold-light" />
              <TrackedLink
                href={contacts.telHref}
                event="call_click"
                props={{ place: 'footer' }}
                className="font-medium text-primary-fg"
              >
                {contacts.phonePrimary}
              </TrackedLink>
            </li>
            <li className="flex items-center gap-3">
              <IconMail size={17} className="shrink-0 text-gold-light" />
              <a href={`mailto:${contacts.email}`} className="font-medium text-primary-fg">
                {contacts.email}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <IconClock size={17} className="mt-0.5 shrink-0 text-gold-light" />
              <span>
                {friday ? <>Пятница: {formatMinutes(friday.startMinute)}–{formatMinutes(friday.endMinute)}</> : null}
                <br />
                <span className="text-primary-fg/60">Полный график по дням недели уточняйте у менеджера</span>
              </span>
            </li>
          </ul>
        </div>

        <div>
          <p className="eyebrow eyebrow-on-dark">Разделы</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
            {pages.map((page) => (
              <li key={page.href}>
                <Link href={page.href} className="text-primary-fg/80 transition-colors hover:text-gold-light">
                  {page.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={contacts.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-fg/80 transition-colors hover:text-gold-light"
              >
                Instagram
              </a>
            </li>
            <li>
              <a
                href={contacts.gisFirmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-fg/80 transition-colors hover:text-gold-light"
              >
                2ГИС
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/12">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-primary-fg/60 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {company.nameRu}. Караганда.
          </p>
          <p>
            Цены и условия — по запросу у менеджера
            {flags.priceDisplay === 'off' ? '' : ' либо ориентировочно после замера'}.
          </p>
          {legalEntity ? <p>{legalEntity}</p> : null}
        </div>
      </div>
    </footer>
  );
}
