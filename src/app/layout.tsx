import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import './globals.css';
import { Analytics } from '@/components/Analytics';
import { CookieConsent } from '@/components/CookieConsent';
import { MobileActionBar } from '@/components/MobileActionBar';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { analytics, company, contacts, site } from '@/lib/config';
import { getClaimsMap } from '@/lib/domain/claims';
import { navPages, publishedPages } from '@/lib/pages';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: 'Пластиковые окна и балконы под ключ в Караганде — Бетта Пласт',
    template: '%s',
  },
  description:
    'Производство, замер, установка. Окна, остекление балконов, перегородки, ремонт окон. Караганда, улица Складская, 8.',
  applicationName: company.nameRu,
  formatDetection: { telephone: true, address: false, email: false },
  openGraph: {
    type: 'website',
    locale: 'ru_KZ',
    siteName: company.nameRu,
    url: site.url,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#fbf9f6',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Navigation depends on which claims the owner has confirmed (§6).
  const claims = await getClaimsMap();
  const confirmed = new Set(
    [...claims.values()].filter((claim) => claim.status === 'confirmed').map((claim) => claim.key),
  );

  return (
    <html lang="ru">
      <head>
        {/* Typography with good Cyrillic coverage (§10); system fonts are the fallback. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:bg-surface focus:px-4 focus:py-2"
        >
          Перейти к содержимому
        </a>
        <SiteHeader
          nav={navPages(confirmed).map((page) => ({ href: page.path, label: page.navLabel }))}
          phone={contacts.phonePrimary}
          waHref={contacts.waHref}
        />
        <main id="main" className="pb-20 md:pb-0">
          {children}
        </main>
        <SiteFooter pages={publishedPages(confirmed).map((page) => ({ href: page.path, label: page.navLabel }))} />
        <MobileActionBar phone={contacts.phonePrimary} waHref={contacts.waHref} />
        <CookieConsent />
        <Analytics
          ids={{
            ymCounterId: analytics.ymCounterId,
            ga4Id: analytics.ga4Id,
            metaPixelId: analytics.metaPixelId,
          }}
        />
      </body>
    </html>
  );
}
