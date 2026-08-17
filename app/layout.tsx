import './globals.css';
import type { Metadata } from 'next';
import { Oswald, Inter, Source_Serif_4 } from 'next/font/google';
import { LayoutWrapper } from '@/components/layout/layout-wrapper';

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://lescahiersdelaguadeloupe.fr'),
  title: {
    default: 'Les Cahiers de la Guadeloupe — Revue d’analyse et d’investigation',
    template: '%s — Les Cahiers de la Guadeloupe',
  },
  description:
    'Revue d’analyse et d’investigation. Comprendre aujourd’hui pour agir demain. Enquêter, comprendre, éclairer le débat public.',
  keywords: [
    'Guadeloupe',
    'investigation',
    'analyse',
    'Le Gosier',
    'gouvernance locale',
    'recherche',
    'journalisme',
  ],
  authors: [{ name: 'Les Cahiers de la Guadeloupe' }],
  openGraph: {
    type: 'website',
    locale: 'fr_GP',
    siteName: 'Les Cahiers de la Guadeloupe',
    title: 'Les Cahiers de la Guadeloupe — Revue d’analyse et d’investigation',
    description:
      'Enquêter, comprendre, éclairer le débat public. Comprendre aujourd’hui pour agir demain.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Les Cahiers de la Guadeloupe',
    description:
      'Revue d’analyse et d’investigation. Comprendre aujourd’hui pour agir demain.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${oswald.variable} ${inter.variable} ${sourceSerif.variable}`}>
      <body className="font-body antialiased">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
        >
          Aller au contenu
        </a>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
