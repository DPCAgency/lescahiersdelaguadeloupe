import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://lescahiersdelaguadeloupe.fr';
  const now = new Date();
  const routes = [
    '',
    '/politique-institutions',
    '/economie',
    '/societe',
    '/territoires',
    '/environnement',
    '/culture',
    '/enquetes',
    '/les-cahiers',
    '/connexion',
    '/inscription',
    '/mon-compte',
    '/achat-confirme',
    '/archives',
    '/sujets',
    '/communes',
    '/redaction',
    '/notre-methode',
    '/droit-de-reponse',
    '/contact',
    '/mentions-legales',
    '/politique-confidentialite',
    '/enquetes/qui-gouverne-reellement-le-gosier',
    '/les-cahiers/numero-02',
    '/les-cahiers/numero-02/acheter',
  ];
  return routes.map((r) => ({
    url: `${base}${r}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: r === '' ? 1 : 0.7,
  }));
}
