export type InfoLevel =
  | 'fait'
  | 'document'
  | 'temoignage'
  | 'rapprochement'
  | 'analyse'
  | 'question'
  | 'hypothese';

export type RubricSlug =
  | 'politique-institutions'
  | 'economie'
  | 'societe'
  | 'territoires'
  | 'environnement'
  | 'culture';

export type FormatEditorial =
  | 'enquete'
  | 'analyse'
  | 'decryptage'
  | 'entretien'
  | 'reportage'
  | 'chronologie'
  | 'tribune'
  | 'dossier'
  | 'documents';

export interface Rubric {
  slug: RubricSlug;
  label: string;
  shortLabel: string;
  description: string;
  subtopics: string[];
}

export type AccessType = 'free' | 'member' | 'subscriber' | 'purchase' | 'hybrid';

export interface ArticleCardData {
  slug: string;
  rubric: RubricSlug;
  format: FormatEditorial;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  readingTime: number;
  chapters?: number;
  image?: string;
  imageAlt?: string;
  featured?: boolean;
  accessType: AccessType;
}

export interface IssueSummary {
  number: string;
  date: string;
  title: string;
  subtitle: string;
  cover?: string;
  description: string;
  pageCount: number;
  pricePerPage: number;
  fullDownloadPrice: number;
  pdfFile?: string;
}

export interface IssuePage {
  pageNumber: number;
  title: string;
  previewImage: string;
  isFree: boolean;
  price?: number;
}

export interface SiteSettings {
  subscriptionsEnabled: boolean;
  pagePurchaseEnabled: boolean;
  fullIssuePurchaseEnabled: boolean;
  pdfDownloadEnabled: boolean;
}

export type ProductType =
  | 'issue_web'
  | 'issue_pdf'
  | 'issue_ebook'
  | 'article_access'
  | 'chapter_access'
  | 'page_access'
  | 'subscription'
  | 'bundle';

export interface Product {
  id: string;
  type: ProductType;
  title: string;
  price: string;
  currency: string;
  includedInSubscription?: boolean;
  description: string;
  downloadAllowed: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  periodicity: string;
  description: string;
  features: string[];
  pdfIncluded: boolean;
  archiveAccess: boolean;
  highlighted?: boolean;
}

export interface ChapterItem {
  index: string;
  title: string;
  description: string;
  href: string;
}

export interface KeyFigure {
  value: string;
  label: string;
}

export interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  people?: string;
  type: 'fait' | 'document' | 'temoignage' | 'decision';
  source?: string;
}

export interface ActorNode {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export interface Commune {
  slug: string;
  name: string;
  description: string;
}

export interface SubjectItem {
  slug: string;
  label: string;
  articleCount: number;
}
