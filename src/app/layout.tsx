import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
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

/**
 * Typography with full Cyrillic coverage (§10). Self-hosted through next/font,
 * so there is no third-party request, no render-blocking stylesheet and no
 * layout shift from a late-swapping font.
 * Kazakh glyphs (ә, і, ң, ғ, ү, ұ, қ, ө, һ) are included in the cyrillic subset.
 */
const manrope = Manrope({
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-manrope',
});

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

/**
 * The header/footer navigation depends on which claims the owner has confirmed,
 * so it must be resolved per request — a statically prerendered layout would
 * freeze the menu (and the gated pages) at build time.
 */
export const dynamic = 'force-dynamic';

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
      <body className={`${manrope.variable} min-h-screen antialiased`}>
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
