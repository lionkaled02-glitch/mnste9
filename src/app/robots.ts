import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://khadamat.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/ar/dashboard/',
          '/en/dashboard/',
          '/ar/admin/',
          '/en/admin/',
          '/ar/login',
          '/en/login',
          '/ar/register',
          '/en/register',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
