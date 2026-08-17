export interface AuthorWithArticleCount {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  job_title: string | null;
  photo_path: string | null;
  email_public: string | null;
  is_active: boolean;
  article_count?: number;
}
