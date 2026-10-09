import type { MetadataRoute } from 'next';

import { site } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // The admin panel, the media endpoint and the API must never be indexed.
        disallow: ['/admin', '/api/', '/media/', '/spasibo', '/status/'],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
