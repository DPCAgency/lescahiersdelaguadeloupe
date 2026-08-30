import type { Metadata } from 'next';

interface SeoOptions {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  authors?: string[];
}

const BASE_URL = 'https://lescahiersdelaguadeloupe.fr';

export function buildMetadata({
  title,
  description,
  path,
  image,
  type = 'website',
  publishedTime,
  authors,
}: SeoOptions): Metadata {
  const url = `${BASE_URL}${path}`;
  const ogImage = image ?? '/og-default.jpg';

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type,
      url,
      title,
      description,
      siteName: 'Les Cahiers de la Guadeloupe',
      locale: 'fr_GP',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(authors ? { authors } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}
