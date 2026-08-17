/*
# Core Editorial Tables

## Purpose
Creates the foundational tables for the editorial CMS of "Les Cahiers de la Guadeloupe":
user profiles, authors, categories, territories, articles, article blocks,
article-territory links, and article-to-issue source links.

## New Tables

### profiles
- `id` (uuid, PK, references auth.users) — one row per authenticated user
- `first_name` (text) — user's first name
- `last_name` (text) — user's last name
- `display_name` (text) — public display name
- `avatar_url` (text) — avatar image URL
- `role` (text, default 'reader') — one of: reader, editor, admin, super_admin
- `status` (text, default 'active') — account status
- `created_at`, `updated_at` (timestamptz)

### authors
- `id` (uuid, PK)
- `name` (text, not null) — author's full name
- `slug` (text, unique) — URL-safe slug
- `bio` (text) — biography
- `job_title` (text) — role/title at the publication
- `photo_path` (text) — path to author photo in storage
- `email_public` (text) — public contact email (nullable)
- `is_active` (boolean, default true)
- `created_at`, `updated_at` (timestamptz)

### categories
- `id` (uuid, PK)
- `name` (text, not null) — display name
- `slug` (text, unique) — URL slug
- `description` (text) — category description
- `position` (int, default 0) — display order
- `is_active` (boolean, default true)
- `created_at`, `updated_at` (timestamptz)

### territories
- `id` (uuid, PK)
- `name` (text, not null) — territory name
- `slug` (text, unique) — URL slug
- `type` (text) — one of: commune, archipel, zone, territoire
- `description` (text)
- `cover_image_path` (text) — cover image path in storage
- `is_active` (boolean, default true)
- `created_at`, `updated_at` (timestamptz)

### articles
- `id` (uuid, PK)
- `title` (text, not null)
- `slug` (text, unique) — URL slug
- `subtitle` (text)
- `excerpt` (text) — short summary for cards
- `format` (text) — one of: enquete, analyse, decryptage, entretien, chronologie, tribune, reportage, dossier
- `category_id` (uuid, FK → categories)
- `author_id` (uuid, FK → authors)
- `hero_image_path` (text) — hero image path in storage
- `hero_caption` (text)
- `hero_credit` (text)
- `status` (text, default 'draft') — one of: draft, review, scheduled, published, archived
- `featured` (boolean, default false)
- `published_at` (timestamptz)
- `seo_title` (text)
- `seo_description` (text)
- `social_image_path` (text)
- `reading_time_minutes` (int)
- `created_at`, `updated_at` (timestamptz)

### article_blocks
- `id` (uuid, PK)
- `article_id` (uuid, FK → articles, ON DELETE CASCADE)
- `type` (text) — block type (paragraph, heading, image, quote, key_figures, timeline, fact, document, testimony, analysis, open_question, hypothesis, sidebar, video, source, issue_reference, gallery)
- `position` (int, default 0) — display order within article
- `content_json` (jsonb) — flexible structured content
- `source_block_id` (uuid) — links to extracted_blocks for provenance tracking
- `created_at`, `updated_at` (timestamptz)

### article_territories
- Junction table: `article_id` (uuid, FK → articles) + `territory_id` (uuid, FK → territories)
- Composite PK on (article_id, territory_id)

### article_issue_sources
- `id` (uuid, PK)
- `article_id` (uuid, FK → articles, ON DELETE CASCADE)
- `issue_id` (uuid) — FK to issues (added in migration 2, so no constraint yet)
- `page_start` (int) — first page in the issue this article derives from
- `page_end` (int) — last page
- `source_notes` (text)
- `created_at` (timestamptz)

## Security
- RLS enabled on ALL tables.
- profiles: authenticated users can read/update their own profile.
- authors, categories, territories: public read (anon + authenticated), admin write via service role.
- articles: public read only when status = 'published'; all writes via service role (admin).
- article_blocks: public read when parent article is published; writes via service role.
- article_territories: public read; writes via service role.
- article_issue_sources: public read; writes via service role.

## Notes
1. The FK from article_issue_sources.issue_id to issues.id will be added in migration 2.
2. All tables use gen_random_uuid() for default IDs.
3. updated_at is maintained via a trigger function.
*/

-- =========================================================
-- HELPER: updated_at trigger function
-- =========================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text DEFAULT '',
  last_name text DEFAULT '',
  display_name text DEFAULT '',
  avatar_url text,
  role text NOT NULL DEFAULT 'reader',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- AUTHORS
-- =========================================================
CREATE TABLE IF NOT EXISTS authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  bio text,
  job_title text,
  photo_path text,
  email_public text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE authors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authors_public_read" ON authors;
CREATE POLICY "authors_public_read" ON authors FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "authors_admin_write" ON authors;
CREATE POLICY "authors_admin_write" ON authors FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')));

CREATE TRIGGER set_updated_at_authors
  BEFORE UPDATE ON authors
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- CATEGORIES
-- =========================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  position int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_public_read" ON categories;
CREATE POLICY "categories_public_read" ON categories FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "categories_admin_write" ON categories;
CREATE POLICY "categories_admin_write" ON categories FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')));

CREATE TRIGGER set_updated_at_categories
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- TERRITORIES
-- =========================================================
CREATE TABLE IF NOT EXISTS territories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  type text NOT NULL DEFAULT 'commune',
  description text,
  cover_image_path text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE territories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "territories_public_read" ON territories;
CREATE POLICY "territories_public_read" ON territories FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "territories_admin_write" ON territories;
CREATE POLICY "territories_admin_write" ON territories FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')));

CREATE TRIGGER set_updated_at_territories
  BEFORE UPDATE ON territories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- ARTICLES
-- =========================================================
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  subtitle text,
  excerpt text,
  format text NOT NULL DEFAULT 'analyse',
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  author_id uuid REFERENCES authors(id) ON DELETE SET NULL,
  hero_image_path text,
  hero_caption text,
  hero_credit text,
  status text NOT NULL DEFAULT 'draft',
  featured boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  social_image_path text,
  reading_time_minutes int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "articles_public_read" ON articles;
CREATE POLICY "articles_public_read" ON articles FOR SELECT
  TO anon, authenticated USING (status = 'published');

DROP POLICY IF EXISTS "articles_admin_write" ON articles;
CREATE POLICY "articles_admin_write" ON articles FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')));

CREATE TRIGGER set_updated_at_articles
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);

-- =========================================================
-- ARTICLE_BLOCKS
-- =========================================================
CREATE TABLE IF NOT EXISTS article_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  type text NOT NULL,
  position int NOT NULL DEFAULT 0,
  content_json jsonb,
  source_block_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE article_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "article_blocks_public_read" ON article_blocks;
CREATE POLICY "article_blocks_public_read" ON article_blocks FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM articles WHERE articles.id = article_blocks.article_id AND articles.status = 'published')
  );

DROP POLICY IF EXISTS "article_blocks_admin_write" ON article_blocks;
CREATE POLICY "article_blocks_admin_write" ON article_blocks FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')));

CREATE TRIGGER set_updated_at_article_blocks
  BEFORE UPDATE ON article_blocks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_article_blocks_article ON article_blocks(article_id);
CREATE INDEX IF NOT EXISTS idx_article_blocks_position ON article_blocks(article_id, position);

-- =========================================================
-- ARTICLE_TERRITORIES (junction)
-- =========================================================
CREATE TABLE IF NOT EXISTS article_territories (
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  territory_id uuid NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, territory_id)
);

ALTER TABLE article_territories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "article_territories_public_read" ON article_territories;
CREATE POLICY "article_territories_public_read" ON article_territories FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM articles WHERE articles.id = article_territories.article_id AND articles.status = 'published')
  );

DROP POLICY IF EXISTS "article_territories_admin_write" ON article_territories;
CREATE POLICY "article_territories_admin_write" ON article_territories FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')));

-- =========================================================
-- ARTICLE_ISSUE_SOURCES
-- =========================================================
CREATE TABLE IF NOT EXISTS article_issue_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  issue_id uuid,
  page_start int,
  page_end int,
  source_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE article_issue_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "article_issue_sources_public_read" ON article_issue_sources;
CREATE POLICY "article_issue_sources_public_read" ON article_issue_sources FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM articles WHERE articles.id = article_issue_sources.article_id AND articles.status = 'published')
  );

DROP POLICY IF EXISTS "article_issue_sources_admin_write" ON article_issue_sources;
CREATE POLICY "article_issue_sources_admin_write" ON article_issue_sources FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')));

CREATE INDEX IF NOT EXISTS idx_article_issue_sources_article ON article_issue_sources(article_id);
CREATE INDEX IF NOT EXISTS idx_article_issue_sources_issue ON article_issue_sources(issue_id);
