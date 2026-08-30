import type {
  ArticleCardData,
  KeyFigure,
  TimelineEvent,
  ActorNode,
  ChapterItem,
} from '@/types/editorial';

export const heroData = {
  label: 'Enquête',
  title: 'Qui gouverne réellement Le Gosier ?',
  issueNumber: 'N°02',
  issueDate: 'Août 2026',
  excerpt:
    'Ce cahier ne désigne pas de coupables. Il pose une question : qui exerce réellement l’influence dans la fabrication de la décision publique au Gosier ?',
  ctaPrimary: { label: 'Découvrir l’enquête', href: '/enquetes/qui-gouverne-reellement-le-gosier' },
  ctaSecondary: { label: 'Découvrir le cahier N°02', href: '/les-cahiers/numero-02' },
};

export const issueBarData = {
  number: 'N°02',
  date: 'Août 2026',
  tagline: 'Enquêter, comprendre, éclairer le débat public',
};

export const whoDecidesData = {
  intro:
    'Cette enquête cherche à comprendre comment se construit réellement la décision publique et où se situent les différents centres d’influence.',
  actors: [
    { id: 'maire', label: 'Le maire', description: 'Autorité de police, exécutif local, signature des actes.', icon: 'Landmark' },
    { id: 'elus', label: 'Les élus', description: 'Conseil municipal, commissions, groupes politiques.', icon: 'Users' },
    { id: 'administration', label: 'L’administration municipale', description: 'Secrétariat général, directions, services techniques.', icon: 'Building2' },
    { id: 'cabinet', label: 'Le cabinet', description: 'Conseillers, chefs de cabinet, collaborateurs du maire.', icon: 'Briefcase' },
    { id: 'economiques', label: 'Les acteurs économiques', description: 'Entreprises, associations subventionnées, partenaires.', icon: 'TrendingUp' },
    { id: 'reseaux', label: 'Les réseaux constitués', description: 'Liens constitués au fil des campagnes et des majorités.', icon: 'Network' },
  ] as ActorNode[],
};

export const editorialIntroData = {
  label: 'Gouvernance locale',
  title: 'Une question de gouvernance',
  question:
    'Les différentes fonctions, relations et intérêts sont-ils demeurés suffisamment séparés pour garantir l’impartialité de la décision publique ?',
};

export const dossierData = {
  title: 'Le dossier',
  subtitle: 'Qui gouverne réellement Le Gosier ?',
  chapters: [
    { index: '01', title: 'Une enquête, pas un réquisitoire', description: 'Le cadre méthodologique de ce cahier.', href: '/enquetes/qui-gouverne-reellement-le-gosier#chapitre-01' },
    { index: '02', title: 'Regarder la mécanique', description: 'Comment se construit la décision publique.', href: '/enquetes/qui-gouverne-reellement-le-gosier#chapitre-02' },
    { index: '03', title: 'Le Gosier : un territoire aux enjeux économiques importants', description: 'Tourisme, économie nocturne, autorisations et décisions publiques.', href: '/enquetes/qui-gouverne-reellement-le-gosier#chapitre-03' },
    { index: '04', title: 'Les gouvernances municipales depuis 2021', description: 'Chronologie des changements politiques.', href: '/enquetes/qui-gouverne-reellement-le-gosier#chapitre-04' },
    { index: '05', title: 'Directeur de cabinet et entrepreneur : où se situe la frontière ?', description: 'Analyse des fonctions publiques et intérêts privés.', href: '/enquetes/qui-gouverne-reellement-le-gosier#chapitre-05' },
    { index: '06', title: 'De la campagne à la subvention', description: '46 370,10 € qui interrogent.', href: '/enquetes/qui-gouverne-reellement-le-gosier#chapitre-06' },
    { index: '07', title: 'Conclusion : qui gouverne réellement Le Gosier ?', description: 'La question centrale reste ouverte.', href: '/enquetes/qui-gouverne-reellement-le-gosier#chapitre-07' },
  ] as ChapterItem[],
};

export const keyFiguresData: KeyFigure[] = [
  { value: '67', label: 'soirées concernées' },
  { value: '46 370,10 €', label: 'montant étudié' },
  { value: '3', label: 'gouvernances municipales successives' },
  { value: '1', label: 'question centrale' },
];

export const timelineData: TimelineEvent[] = [
  { date: '2020', title: 'Changement de gouvernance municipale', description: 'Une nouvelle majorité est élue. La composition du conseil municipal et du cabinet évolue.', people: 'Conseil municipal, cabinet du maire', type: 'fait' },
  { date: '2021', title: 'Délibérations sur les subventions', description: 'Des délibérations municipales encadrent l’attribution de subventions à des structures locales.', people: 'Conseil municipal', type: 'document' },
  { date: '2022', title: 'Saisine et recours', description: 'Des recours contentieux et des saisines administratives sont enregistrés concernant certaines décisions.', people: 'Tribunal administratif, préfecture', type: 'decision' },
  { date: '2023', title: 'Témoignages recueillis', description: 'La rédaction recueille des témoignages d’élus, d’agents et d’acteurs locaux.', people: 'Élus, agents municipaux, acteurs économiques', type: 'temoignage' },
  { date: '2024–2026', title: 'Mise en perspective', description: 'Analyse des rôles, des intérêts et des décisions publiques au Gosier.', people: 'La rédaction', type: 'fait' },
];

export const centralQuestionData =
  'Les différentes fonctions, relations et intérêts sont-ils demeurés suffisamment séparés pour garantir l’impartialité de la décision publique ?';

export const latestInvestigationsData: ArticleCardData[] = [
  {
    slug: 'qui-gouverne-reellement-le-gosier',
    rubric: 'politique-institutions',
    format: 'enquete',
    title: 'Qui gouverne réellement Le Gosier ?',
    excerpt: 'Maire, élus, cabinet, administration, acteurs économiques : où s’exerce réellement l’influence dans la fabrication de la décision publique ?',
    date: '15 août 2026',
    author: 'La rédaction',
    readingTime: 35,
    chapters: 7,
    image: 'https://images.pexels.com/photos/2120356/pexels-photo-2120356.jpeg?auto=compress&cs=tinysrgb&w=1280',
    imageAlt: 'Vue côtière de la Guadeloupe',
    featured: true,
    accessType: 'free',
  },
  {
    slug: 'gouvernance-municipale-gosier',
    rubric: 'politique-institutions',
    format: 'analyse',
    title: 'Comprendre les rôles, les fonctions et les frontières',
    excerpt: 'Que prévoit le code général des collectivités ? Comment se répartissent les compétences entre maire, conseil municipal et cabinet ?',
    date: '15 août 2026',
    author: 'La rédaction',
    readingTime: 12,
    image: 'https://images.pexels.com/photos/25637102/pexels-photo-25637102.jpeg?auto=compress&cs=tinysrgb&w=900',
    imageAlt: 'Vue aérienne d’une côte antillaise',
    accessType: 'free',
  },
  {
    slug: 'chronologie-faits-gosier',
    rubric: 'politique-institutions',
    format: 'chronologie',
    title: 'Les étapes clés reconstituées',
    excerpt: 'Une chronologie documentée des faits, décisions et événements qui ont marqué la gouvernance du Gosier.',
    date: '15 août 2026',
    author: 'La rédaction',
    readingTime: 8,
    accessType: 'free',
  },
];

export const analysisData: ArticleCardData[] = [
  {
    slug: 'structures-et-interets',
    rubric: 'economie',
    format: 'decryptage',
    title: 'Structures et intérêts : entreprises, associations, fonctions',
    excerpt: 'Croisement des mandats, des activités professionnelles et des liens avec la décision publique.',
    date: '15 août 2026',
    author: 'La rédaction',
    readingTime: 15,
    accessType: 'free',
  },
  {
    slug: 'gouvernance-municipale-gosier',
    rubric: 'politique-institutions',
    format: 'analyse',
    title: 'Comprendre les rôles, les fonctions et les frontières',
    excerpt: 'Que prévoit le code général des collectivités ? Comment se répartissent les compétences entre maire, conseil municipal et cabinet ?',
    date: '15 août 2026',
    author: 'La rédaction',
    readingTime: 12,
    accessType: 'free',
  },
  {
    slug: 'chronologie-faits-gosier',
    rubric: 'politique-institutions',
    format: 'chronologie',
    title: 'Les étapes clés reconstituées',
    excerpt: 'Une chronologie documentée des faits, décisions et événements qui ont marqué la gouvernance du Gosier.',
    date: '15 août 2026',
    author: 'La rédaction',
    readingTime: 8,
    accessType: 'free',
  },
];

export const territoriesData = {
  title: 'Les territoires',
  subtitle: 'Observer la Guadeloupe commune par commune.',
  communes: [
    { slug: 'le-gosier', name: 'Le Gosier', description: 'Pôle économique et résidentiel majeur.' },
    { slug: 'les-abymes', name: 'Les Abymes', description: 'Commune la plus peuplée de l’archipel.' },
    { slug: 'pointe-a-pitre', name: 'Pointe-à-Pitre', description: 'Cœur économique et commercial.' },
    { slug: 'baie-mahault', name: 'Baie-Mahault', description: 'Zone industrielle et d’activité.' },
    { slug: 'petit-bourg', name: 'Petit-Bourg', description: 'Porte d’entrée de Basse-Terre.' },
    { slug: 'sainte-anne', name: 'Sainte-Anne', description: 'Tourisme et littoral.' },
    { slug: 'saint-francois', name: 'Saint-François', description: 'Tourisme et activités nautiques.' },
    { slug: 'basse-terre', name: 'Basse-Terre', description: 'Préfecture et chef-lieu.' },
    { slug: 'petit-canal', name: 'Petit-Canal', description: 'Commune de Grande-Terre.' },
  ],
};

export const methodData = {
  title: 'Notre méthode',
  steps: [
    { label: 'Enquêter', description: 'Examiner les faits, documents et témoignages.' },
    { label: 'Comprendre', description: 'Reconstituer les contextes et mécanismes.' },
    { label: 'Éclairer', description: 'Mettre les informations en perspective.' },
    { label: 'Débattre', description: 'Permettre la contradiction et le débat public.' },
  ],
};

export const newsletterData = {
  title: 'Les Cahiers — La lettre',
  text: 'Recevez les nouvelles enquêtes, analyses et publications.',
  placeholder: 'votre@email.fr',
  buttonText: 'S’inscrire',
  notice: 'Mensuelle, gratuite. Désinscription en un clic. RGPD.',
};
