import type { IssueSummary, IssuePage, ChapterItem } from '@/types/editorial';

export const issues: IssueSummary[] = [
  {
    number: 'N°02',
    date: 'Août 2026',
    title: 'Qui gouverne réellement Le Gosier ?',
    subtitle: 'Enquête sur la gouvernance locale',
    cover: 'https://images.pexels.com/photos/38129343/pexels-photo-38129343.jpeg?auto=compress&cs=tinysrgb&w=800',
    description:
      'Ce cahier ne désigne pas de coupables. Il pose une question : qui exerce réellement l’influence dans la fabrication de la décision publique au Gosier ?',
    pageCount: 11,
    pricePerPage: 0.30,
    fullDownloadPrice: 2.90,
    pdfFile: '/assets/pdf/N°2_-_LES_CAHIERS_DE_LA_GUADELOUPE_2026.pdf',
  },
];

export const issueN02: IssueSummary = issues[0];

export const issueN02Pages: IssuePage[] = [
  { pageNumber: 1, title: 'Couverture', previewImage: 'https://images.pexels.com/photos/38129343/pexels-photo-38129343.jpeg?auto=compress&cs=tinysrgb&w=600', isFree: true },
  { pageNumber: 2, title: 'Une question de gouvernance', previewImage: 'https://images.pexels.com/photos/25637102/pexels-photo-25637102.jpeg?auto=compress&cs=tinysrgb&w=600', isFree: true },
  { pageNumber: 3, title: 'Le Gosier : un territoire aux enjeux économiques importants', previewImage: '', isFree: false },
  { pageNumber: 4, title: 'Les gouvernances municipales depuis 2021', previewImage: '', isFree: false },
  { pageNumber: 5, title: 'Regarder la mécanique', previewImage: '', isFree: false },
  { pageNumber: 6, title: 'Directeur de cabinet et entrepreneur', previewImage: '', isFree: false },
  { pageNumber: 7, title: 'De la campagne à la subvention', previewImage: '', isFree: false },
  { pageNumber: 8, title: 'De l’argent politique à l’argent public', previewImage: '', isFree: false },
  { pageNumber: 9, title: 'Laupen–Simonnot', previewImage: '', isFree: false },
  { pageNumber: 10, title: 'Une question centrale', previewImage: '', isFree: false },
  { pageNumber: 11, title: 'Conclusion', previewImage: '', isFree: false },
];

export const issueN02Chapters: ChapterItem[] = [
  { index: '01', title: 'Une enquête, pas un réquisitoire', description: 'Le cadre méthodologique de ce cahier.', href: '/enquetes/qui-gouverne-reellement-le-gosier#chapitre-01' },
  { index: '02', title: 'Regarder la mécanique', description: 'Comment se construit la décision publique.', href: '/enquetes/qui-gouverne-reellement-le-gosier#chapitre-02' },
  { index: '03', title: 'Le Gosier : un territoire aux enjeux économiques importants', description: 'Tourisme, économie nocturne, autorisations et décisions publiques.', href: '/enquetes/qui-gouverne-reellement-le-gosier#chapitre-03' },
  { index: '04', title: 'Les gouvernances municipales depuis 2021', description: 'Chronologie des changements politiques.', href: '/enquetes/qui-gouverne-reellement-le-gosier#chapitre-04' },
  { index: '05', title: 'Directeur de cabinet et entrepreneur : où se situe la frontière ?', description: 'Analyse des fonctions publiques et intérêts privés.', href: '/enquetes/qui-gouverne-reellement-le-gosier#chapitre-05' },
  { index: '06', title: 'De la campagne à la subvention', description: '46 370,10 € qui interrogent.', href: '/enquetes/qui-gouverne-reellement-le-gosier#chapitre-06' },
  { index: '07', title: 'Conclusion : qui gouverne réellement Le Gosier ?', description: 'La question centrale reste ouverte.', href: '/enquetes/qui-gouverne-reellement-le-gosier#chapitre-07' },
];
