import type {
  ArticleCardData,
  ChapterItem,
  KeyFigure,
  TimelineEvent,
  ActorNode,
  Rubric,
  Commune,
  SubjectItem,
  IssueSummary,
  IssuePage,
  SiteSettings,
} from '@/types/editorial';

export const HERO_IMAGE =
  'https://images.pexels.com/photos/38129343/pexels-photo-38129343.jpeg?auto=compress&cs=tinysrgb&w=1920';

export const ISSUE_NUMBER = 'N°2';
export const ISSUE_DATE = '15 août 2026';

export const HERO_QUOTE =
  'Ce cahier ne désigne pas de coupables. Il pose une question : qui exerce réellement l’influence dans la fabrication de la décision publique au Gosier ?';

export const CENTRAL_QUESTION =
  'Les différentes fonctions, relations et intérêts sont-ils demeurés suffisamment séparés pour garantir l’impartialité de la décision publique ?';

export const WHO_DECIDES_INTRO =
  'Cette enquête cherche à comprendre comment se construit réellement la décision publique et où se situent les différents centres d’influence.';

export const RUBRICS: Rubric[] = [
  {
    slug: 'politique-institutions',
    label: 'Politique & Institutions',
    shortLabel: 'Politique',
    description: 'Pouvoirs publics, décisions, institutions et gouvernance locale.',
    subtopics: [
      'Gouvernance locale',
      'Collectivités',
      'Municipalités',
      'Région',
      'Département',
      'Intercommunalités',
      'Élections',
      'Politiques publiques',
      'Administration',
    ],
  },
  {
    slug: 'economie',
    label: 'Économie',
    shortLabel: 'Économie',
    description: 'Entreprises, tourisme, emploi, finances publiques et développement local.',
    subtopics: [
      'Entreprises',
      'Tourisme',
      'Emploi',
      'Commerce',
      'Finances publiques',
      'Subventions',
      'Développement',
      'Marchés publics',
      'Économie locale',
    ],
  },
  {
    slug: 'societe',
    label: 'Société',
    shortLabel: 'Société',
    description: 'Santé, éducation, jeunesse, vie quotidienne et services publics.',
    subtopics: [
      'Santé',
      'Éducation',
      'Jeunesse',
      'Vie quotidienne',
      'Logement',
      'Sécurité',
      'Mobilité',
      'Précarité',
      'Services publics',
    ],
  },
  {
    slug: 'territoires',
    label: 'Territoires',
    shortLabel: 'Territoires',
    description: 'Le traitement territorial de la Guadeloupe, commune par commune.',
    subtopics: [
      'Le Gosier',
      'Les Abymes',
      'Pointe-à-Pitre',
      'Baie-Mahault',
      'Petit-Bourg',
      'Sainte-Anne',
      'Saint-François',
      'Basse-Terre',
      'Petit-Canal',
    ],
  },
  {
    slug: 'environnement',
    label: 'Environnement',
    shortLabel: 'Environnement',
    description: 'Eau, pollution, déchets, énergie, littoral et biodiversité.',
    subtopics: [
      'Eau',
      'Pollution',
      'Déchets',
      'Énergie',
      'Littoral',
      'Agriculture',
      'Risques naturels',
      'Biodiversité',
      'Aménagement',
    ],
  },
  {
    slug: 'culture',
    label: 'Culture',
    shortLabel: 'Culture',
    description: 'Patrimoine, musique, littérature, identité, création et mémoire.',
    subtopics: [
      'Patrimoine',
      'Musique',
      'Littérature',
      'Identité',
      'Création',
      'Histoire',
      'Mémoire',
      'Événements culturels',
    ],
  },
];

export const COMMUNES: Commune[] = [
  { slug: 'le-gosier', name: 'Le Gosier', description: 'Pôle économique et résidentiel majeur.' },
  { slug: 'les-abymes', name: 'Les Abymes', description: 'Commune la plus peuplée de l’archipel.' },
  { slug: 'pointe-a-pitre', name: 'Pointe-à-Pitre', description: 'Cœur économique et commercial.' },
  { slug: 'baie-mahault', name: 'Baie-Mahault', description: 'Zone industrielle et d’activité.' },
  { slug: 'petit-bourg', name: 'Petit-Bourg', description: 'Porte d’entrée de Basse-Terre.' },
  { slug: 'sainte-anne', name: 'Sainte-Anne', description: 'Tourisme et littoral.' },
  { slug: 'saint-francois', name: 'Saint-François', description: 'Tourisme et activités nautiques.' },
  { slug: 'basse-terre', name: 'Basse-Terre', description: 'Préfecture et chef-lieu.' },
  { slug: 'petit-canal', name: 'Petit-Canal', description: 'Commune de Grande-Terre.' },
];

export const SUBJECTS: SubjectItem[] = [
  { slug: 'eau', label: 'Eau', articleCount: 3 },
  { slug: 'gouvernance-locale', label: 'Gouvernance locale', articleCount: 5 },
  { slug: 'tourisme', label: 'Tourisme', articleCount: 4 },
  { slug: 'foncier', label: 'Foncier', articleCount: 2 },
  { slug: 'sante', label: 'Santé', articleCount: 6 },
  { slug: 'jeunesse', label: 'Jeunesse', articleCount: 3 },
  { slug: 'economie', label: 'Économie', articleCount: 8 },
  { slug: 'culture', label: 'Culture', articleCount: 5 },
  { slug: 'environnement', label: 'Environnement', articleCount: 7 },
];

export const FEATURED_ARTICLES: ArticleCardData[] = [
  {
    slug: 'qui-gouverne-reellement-le-gosier',
    rubric: 'politique-institutions',
    format: 'enquete',
    title: 'Qui gouverne réellement Le Gosier ?',
    excerpt:
      'Maire, élus, cabinet, administration, acteurs économiques : où s’exerce réellement l’influence dans la fabrication de la décision publique ?',
    date: '15 août 2026',
    author: 'La rédaction',
    readingTime: 35,
    chapters: 7,
    image:
      'https://images.pexels.com/photos/2120356/pexels-photo-2120356.jpeg?auto=compress&cs=tinysrgb&w=1280',
    imageAlt: 'Vue côtière de la Guadeloupe',
    featured: true,
    accessType: 'free',
  },
  {
    slug: 'gouvernance-municipale-gosier',
    rubric: 'politique-institutions',
    format: 'analyse',
    title: 'Comprendre les rôles, les fonctions et les frontières',
    excerpt:
      'Que prévoit le code général des collectivités ? Comment se répartissent les compétences entre maire, conseil municipal et cabinet ?',
    date: '15 août 2026',
    author: 'La rédaction',
    readingTime: 12,
    image:
      'https://images.pexels.com/photos/25637102/pexels-photo-25637102.jpeg?auto=compress&cs=tinysrgb&w=900',
    imageAlt: 'Vue aérienne d’une côte antillaise',
    accessType: 'free',
  },
  {
    slug: 'chronologie-faits-gosier',
    rubric: 'politique-institutions',
    format: 'chronologie',
    title: 'Les étapes clés reconstituées',
    excerpt:
      'Une chronologie documentée des faits, décisions et événements qui ont marqué la gouvernance du Gosier.',
    date: '15 août 2026',
    author: 'La rédaction',
    readingTime: 8,
    accessType: 'free',
  },
  {
    slug: 'structures-et-interets',
    rubric: 'economie',
    format: 'decryptage',
    title: 'Structures et intérêts : entreprises, associations, fonctions',
    excerpt:
      'Croisement des mandats, des activités professionnelles et des liens avec la décision publique.',
    date: '15 août 2026',
    author: 'La rédaction',
    readingTime: 15,
    accessType: 'free',
  },
];

export const DOSSIER_CHAPTERS: ChapterItem[] = [
  {
    index: '01',
    title: 'Une enquête, pas un réquisitoire',
    description: 'Le cadre méthodologique de ce cahier.',
    href: '/enquetes/qui-gouverne-reellement-le-gosier#chapitre-01',
  },
  {
    index: '02',
    title: 'Regarder la mécanique',
    description: 'Comment se construit la décision publique.',
    href: '/enquetes/qui-gouverne-reellement-le-gosier#chapitre-02',
  },
  {
    index: '03',
    title: 'Le Gosier : un territoire aux enjeux économiques importants',
    description: 'Tourisme, économie nocturne, autorisations et décisions publiques.',
    href: '/enquetes/qui-gouverne-reellement-le-gosier#chapitre-03',
  },
  {
    index: '04',
    title: 'Les gouvernances municipales depuis 2021',
    description: 'Chronologie des changements politiques.',
    href: '/enquetes/qui-gouverne-reellement-le-gosier#chapitre-04',
  },
  {
    index: '05',
    title: 'Directeur de cabinet et entrepreneur : où se situe la frontière ?',
    description: 'Analyse des fonctions publiques et intérêts privés.',
    href: '/enquetes/qui-gouverne-reellement-le-gosier#chapitre-05',
  },
  {
    index: '06',
    title: 'De la campagne à la subvention',
    description: '46 370,10 € qui interrogent.',
    href: '/enquetes/qui-gouverne-reellement-le-gosier#chapitre-06',
  },
  {
    index: '07',
    title: 'Conclusion : qui gouverne réellement Le Gosier ?',
    description: 'La question centrale reste ouverte.',
    href: '/enquetes/qui-gouverne-reellement-le-gosier#chapitre-07',
  },
];

export const KEY_FIGURES: KeyFigure[] = [
  { value: '67', label: 'soirées concernées' },
  { value: '46 370,10 €', label: 'montant étudié' },
  { value: '3', label: 'gouvernances municipales successives' },
  { value: '1', label: 'question centrale' },
];

export const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    date: '2020',
    title: 'Changement de gouvernance municipale',
    description:
      'Une nouvelle majorité est élue. La composition du conseil municipal et du cabinet évolue.',
    people: 'Conseil municipal, cabinet du maire',
    type: 'fait',
  },
  {
    date: '2021',
    title: 'Délibérations sur les subventions',
    description:
      'Des délibérations municipales encadrent l’attribution de subventions à des structures locales.',
    people: 'Conseil municipal',
    type: 'document',
  },
  {
    date: '2022',
    title: 'Saisine et recours',
    description:
      'Des recours contentieux et des saisines administratives sont enregistrés concernant certaines décisions.',
    people: 'Tribunal administratif, préfecture',
    type: 'decision',
  },
  {
    date: '2023',
    title: 'Témoignages recueillis',
    description:
      'La rédaction recueille des témoignages d’élus, d’agents et d’acteurs locaux.',
    people: 'Élus, agents municipaux, acteurs économiques',
    type: 'temoignage',
  },
  {
    date: '2024–2026',
    title: 'Mise en perspective',
    description:
      'Analyse des rôles, des intérêts et des décisions publiques au Gosier.',
    people: 'La rédaction',
    type: 'fait',
  },
];

export const ACTORS: ActorNode[] = [
  {
    id: 'maire',
    label: 'Le maire',
    description: 'Autorité de police, exécutif local, signature des actes.',
    icon: 'Landmark',
  },
  {
    id: 'elus',
    label: 'Les élus',
    description: 'Conseil municipal, commissions, groupes politiques.',
    icon: 'Users',
  },
  {
    id: 'administration',
    label: 'L’administration municipale',
    description: 'Secrétariat général, directions, services techniques.',
    icon: 'Building2',
  },
  {
    id: 'cabinet',
    label: 'Le cabinet',
    description: 'Conseillers, chefs de cabinet, collaborateurs du maire.',
    icon: 'Briefcase',
  },
  {
    id: 'economiques',
    label: 'Les acteurs économiques',
    description: 'Entreprises, associations subventionnées, partenaires.',
    icon: 'TrendingUp',
  },
  {
    id: 'reseaux',
    label: 'Les réseaux constitués',
    description: 'Liens constitués au fil des campagnes et des majorités.',
    icon: 'Network',
  },
];

export const DOCUMENTS_TO_EXAMINE = [
  { label: 'Demandes', type: 'Document administratif' },
  { label: 'Budgets', type: 'Document financier' },
  { label: 'Instructions administratives', type: 'Courrier officiel' },
  { label: 'Délibérations', type: 'Acte public' },
  { label: 'Conventions', type: 'Accord' },
  { label: 'Décisions', type: 'Acte administratif' },
  { label: 'Comptes rendus', type: 'Document public' },
  { label: 'Courriels', type: 'Correspondance' },
  { label: 'Arrêtés', type: 'Acte réglementaire' },
];

export const WHAT_WE_KNOW = [
  'Trois gouvernances municipales se sont succédé depuis 2020.',
  'Des délibérations municipales ont encadré l’attribution de subventions.',
  'Des recours contentieux ont été enregistrés devant le tribunal administratif.',
  'Des témoignages d’élus, d’agents et d’acteurs locaux ont été recueillis.',
];

export const WHAT_WE_DONT_KNOW = [
  'L’issue des recours contentieux en cours n’est pas connue.',
  'L’intention réelle des acteurs cités n’est pas établie.',
  'L’existence d’un conflit d’intérêt n’est pas prouvée.',
  'La frontière exacte entre fonctions publiques et intérêts privés reste à éclaircir.',
];

export const FORMAT_LABELS: Record<string, string> = {
  enquete: 'Enquête',
  analyse: 'Analyse',
  decryptage: 'Décryptage',
  entretien: 'Entretien',
  reportage: 'Reportage',
  chronologie: 'Chronologie',
  tribune: 'Tribune',
  dossier: 'Dossier',
  documents: 'Documents',
};

export function getRubric(slug: string): Rubric | undefined {
  return RUBRICS.find((r) => r.slug === slug);
}

export const SITE_SETTINGS: SiteSettings = {
  subscriptionsEnabled: false,
  pagePurchaseEnabled: true,
  fullIssuePurchaseEnabled: true,
  pdfDownloadEnabled: true,
};

export const ISSUE_N2: IssueSummary = {
  number: 'N°2',
  date: 'Août 2026',
  title: 'Qui gouverne réellement Le Gosier ?',
  subtitle: 'Enquête sur la gouvernance locale',
  cover: 'https://images.pexels.com/photos/38129343/pexels-photo-38129343.jpeg?auto=compress&cs=tinysrgb&w=800',
  description:
    'Ce cahier ne désigne pas de coupables. Il pose une question : qui exerce réellement l\'influence dans la fabrication de la décision publique au Gosier ?',
  pageCount: 11,
  pricePerPage: 0.30,
  fullDownloadPrice: 2.90,
  pdfFile: '/assets/pdf/N°2_-_LES_CAHIERS_DE_LA_GUADELOUPE_2026.pdf',
};

export const ISSUE_N2_PAGES: IssuePage[] = [
  { pageNumber: 1, title: 'Couverture', previewImage: 'https://images.pexels.com/photos/38129343/pexels-photo-38129343.jpeg?auto=compress&cs=tinysrgb&w=600', isFree: true },
  { pageNumber: 2, title: 'Une question de gouvernance', previewImage: 'https://images.pexels.com/photos/25637102/pexels-photo-25637102.jpeg?auto=compress&cs=tinysrgb&w=600', isFree: true },
  { pageNumber: 3, title: 'Le Gosier : un territoire aux enjeux économiques importants', previewImage: '', isFree: false },
  { pageNumber: 4, title: 'Les gouvernances municipales depuis 2021', previewImage: '', isFree: false },
  { pageNumber: 5, title: 'Regarder la mécanique', previewImage: '', isFree: false },
  { pageNumber: 6, title: 'Directeur de cabinet et entrepreneur', previewImage: '', isFree: false },
  { pageNumber: 7, title: 'De la campagne à la subvention', previewImage: '', isFree: false },
  { pageNumber: 8, title: 'De l\'argent politique à l\'argent public', previewImage: '', isFree: false },
  { pageNumber: 9, title: 'Laupen–Simonnot', previewImage: '', isFree: false },
  { pageNumber: 10, title: 'Une question centrale', previewImage: '', isFree: false },
  { pageNumber: 11, title: 'Conclusion', previewImage: '', isFree: false },
];

export function formatPrice(amount: number): string {
  return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });
}
