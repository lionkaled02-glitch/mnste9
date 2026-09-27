import type { Metadata } from 'next';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://khadamat.com';
export const SITE_NAME = 'خدمات';
export const DEFAULT_DESCRIPTION = 'منصة خدمات هي المنصة العربية الأولى التي تجمع بين أصحاب الأعمال والمستقلين المحترفين.';

export type SupportedLocale = 'ar' | 'en';

interface BuildMetadataInput {
  title: string;
  description?: string;
  path: string;
  locale: SupportedLocale;
  images?: string[];
  type?: 'website' | 'article';
  keywords?: string[];
}

export function normalizeLocale(locale: string): SupportedLocale {
  return locale === 'en' ? 'en' : 'ar';
}

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const {
    title,
    description = DEFAULT_DESCRIPTION,
    path,
    locale,
    images = [`${SITE_URL}/${locale}/opengraph-image`],
    type = 'website',
    keywords = [],
  } = input;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const cleanPath = normalizedPath === '/' ? '' : normalizedPath;
  const url = `${SITE_URL}/${locale}${cleanPath}`;

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: url,
      languages: {
        ar: `${SITE_URL}/ar${cleanPath}`,
        en: `${SITE_URL}/en${cleanPath}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: locale === 'ar' ? 'ar_YE' : 'en_US',
      type,
      images: images.map((image) => ({
        url: image,
        width: 1200,
        height: 630,
        alt: title,
      })),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}
