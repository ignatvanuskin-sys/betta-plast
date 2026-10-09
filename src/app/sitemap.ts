import type { MetadataRoute } from 'next';

import { site } from '@/lib/config';
import { confirmedClaimKeys } from '@/lib/domain/page-gates';
import { publishedPages } from '@/lib/pages';

export const dynamic = 'force-dynamic';

/**
 * The sitemap is generated from the same page registry as the navigation, so a
 * claim-gated page can never end up indexed while it is still unpublished (§6).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const confirmed = await confirmedClaimKeys();
  const now = new Date();

  return publishedPages(confirmed).map((page) => ({
    url: `${site.url}${page.path === '/' ? '' : page.path}`,
    lastModified: now,
    changeFrequency: page.path === '/' ? 'weekly' : 'monthly',
    priority: page.path === '/' ? 1 : page.path === '/balkony' ? 0.9 : 0.7,
  }));
}
