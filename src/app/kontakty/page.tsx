import type { Metadata } from 'next';

import { Breadcrumbs, BreadcrumbSchema, ContactBlock, LocalBusinessSchema } from '@/components/sections';
import { PAGES } from '@/lib/pages';

export const metadata: Metadata = {
  title: PAGES.kontakty.title,
  description: PAGES.kontakty.description,
  alternates: { canonical: '/kontakty' },
};

export default function KontaktyPage() {
  return (
    <>
      <LocalBusinessSchema />
      <BreadcrumbSchema trail={[{ href: '/', label: 'Главная' }, { label: 'Контакты' }]} />
      <Breadcrumbs trail={[{ href: '/', label: 'Главная' }, { label: 'Контакты' }]} />
      <ContactBlock />
    </>
  );
}
