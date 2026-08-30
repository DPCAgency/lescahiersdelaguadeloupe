export type {
  ArticleStatus,
  ArticleFormat,
  ArticleBlockType,
} from './database';

export interface ArticleBlockContent {
  text?: string;
  heading?: string;
  level?: number;
  image_path?: string;
  caption?: string;
  credit?: string;
  quote?: string;
  author?: string;
  info_level?: string;
  figures?: { value: string; label: string }[];
  events?: { date: string; title: string; description: string }[];
  question?: string;
  [key: string]: unknown;
}

export interface ArticleWithRelations {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  excerpt: string | null;
  format: string;
  status: string;
  featured: boolean;
  published_at: string | null;
  reading_time_minutes: number | null;
  category?: { id: string; name: string; slug: string } | null;
  author?: { id: string; name: string; slug: string } | null;
  territories?: { id: string; name: string; slug: string }[];
  issue_source?: {
    issue_id: string;
    issue_number: string;
    issue_title: string;
    page_start: number | null;
    page_end: number | null;
  } | null;
}
