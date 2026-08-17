export type { TerritoryType } from './database';

export interface TerritoryWithArticleCount {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  cover_image_path: string | null;
  is_active: boolean;
  article_count?: number;
}
