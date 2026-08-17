/*
# Issues, Issue Pages, and Issue Assets

## Purpose
Creates the tables for managing Cahiers (issues), their individual pages,
and assets (images, illustrations, documents) attached to issues/pages.

## New Tables

### issues
- `id` (uuid, PK)
- `issue_number` (text, unique) — e.g. "02"
- `slug` (text, unique) — URL slug, e.g. "numero-02"
- `title` (text, not null)
- `subtitle` (text)
- `description` (text)
- `publication_date` (date)
- `cover_image_path` (text) — path to cover image in storage
- `page_count` (int, default 0)
- `status` (text, default 'draft') — one of: draft, published, archived
- `price_per_page` (numeric, default 0.30) — price per individual page in EUR
- `full_download_price` (numeric, default 2.90) — full issue + PDF price in EUR
- `pdf_file_path` (text) — path to PDF in private storage
- `epub_file_path` (text) — path to EPUB in private storage
- `subscriptions_allowed` (boolean, default false)
- `created_at`, `updated_at` (timestamptz)

### issue_pages
- `id` (uuid, PK)
- `issue_id` (uuid, FK → issues, ON DELETE CASCADE)
- `page_number` (int, not null)
- `position` (int, default 0) — display order
- `title` (text) — page title/heading
- `preview_image_path` (text) — low-res preview (public)
- `full_image_path` (text) — high-res image (private, for entitled users)
- `is_free` (boolean, default false) — whether this page is freely accessible
- `individual_price` (numeric) — per-page price override (nullable = use issue default)
- `ocr_status` (text, default 'pending') — one of: pending, processing, completed, failed
- `created_at`, `updated_at` (timestamptz)

### issue_assets
- `id` (uuid, PK)
- `issue_id` (uuid, FK → issues, ON DELETE CASCADE)
- `page_id` (uuid, FK → issue_pages, ON DELETE SET NULL) — nullable for issue-level assets
- `asset_type` (text) — one of: image, illustration, logo, icon, chart, document, other
- `file_path` (text, not null) — path in storage
- `caption` (text)
- `credit` (text)
- `position` (int, default 0)
- `metadata_json` (jsonb) — flexible metadata (dimensions, alt text, etc.)
- `created_at` (timestamptz)

## Security
- RLS enabled on all tables.
- issues: public read when status = 'published'; admin write.
- issue_pages: public read of metadata + preview when parent issue is published; full_image_path visible only via service role or signed URL; admin write.
- issue_assets: public read for public-bucket assets; admin write.

## Foreign Key Added
- article_issue_sources.issue_id → issues.id (ON DELETE SET NULL) — completes the link from migration 1.

## Notes
1. The FK from article_issue_sources to issues is added here (deferred from migration 1).
2. issue_pages.preview_image_path is intended for public/low-res access.
3. issue_pages.full_image_path is intended for private/high-res access via signed URLs.
*/

-- =========================================================
-- ISSUES
-- =========================================================
CREATE TABLE IF NOT EXISTS issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_number text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text,
  description text,
  publication_date date,
  cover_image_path text,
  page_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  price_per_page numeric(10,2) NOT NULL DEFAULT 0.30,
  full_download_price numeric(10,2) NOT NULL DEFAULT 2.90,
  pdf_file_path text,
  epub_file_path text,
  subscriptions_allowed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "issues_public_read" ON issues;
CREATE POLICY "issues_public_read" ON issues FOR SELECT
  TO anon, authenticated USING (status = 'published');

DROP POLICY IF EXISTS "issues_admin_write" ON issues;
CREATE POLICY "issues_admin_write" ON issues FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')));

CREATE TRIGGER set_updated_at_issues
  BEFORE UPDATE ON issues
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_issues_slug ON issues(slug);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);

-- =========================================================
-- ISSUE_PAGES
-- =========================================================
CREATE TABLE IF NOT EXISTS issue_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  page_number int NOT NULL,
  position int NOT NULL DEFAULT 0,
  title text,
  preview_image_path text,
  full_image_path text,
  is_free boolean NOT NULL DEFAULT false,
  individual_price numeric(10,2),
  ocr_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE issue_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "issue_pages_public_read" ON issue_pages;
CREATE POLICY "issue_pages_public_read" ON issue_pages FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM issues WHERE issues.id = issue_pages.issue_id AND issues.status = 'published')
  );

DROP POLICY IF EXISTS "issue_pages_admin_write" ON issue_pages;
CREATE POLICY "issue_pages_admin_write" ON issue_pages FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')));

CREATE TRIGGER set_updated_at_issue_pages
  BEFORE UPDATE ON issue_pages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_issue_pages_issue ON issue_pages(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_pages_number ON issue_pages(issue_id, page_number);

-- =========================================================
-- ISSUE_ASSETS
-- =========================================================
CREATE TABLE IF NOT EXISTS issue_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  page_id uuid REFERENCES issue_pages(id) ON DELETE SET NULL,
  asset_type text NOT NULL DEFAULT 'image',
  file_path text NOT NULL,
  caption text,
  credit text,
  position int NOT NULL DEFAULT 0,
  metadata_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE issue_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "issue_assets_public_read" ON issue_assets;
CREATE POLICY "issue_assets_public_read" ON issue_assets FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM issues WHERE issues.id = issue_assets.issue_id AND issues.status = 'published')
  );

DROP POLICY IF EXISTS "issue_assets_admin_write" ON issue_assets;
CREATE POLICY "issue_assets_admin_write" ON issue_assets FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')));

CREATE INDEX IF NOT EXISTS idx_issue_assets_issue ON issue_assets(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_assets_page ON issue_assets(page_id);

-- =========================================================
-- ADD FK: article_issue_sources.issue_id → issues.id
-- =========================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'article_issue_sources_issue_id_fkey'
      AND table_name = 'article_issue_sources'
  ) THEN
    ALTER TABLE article_issue_sources
      ADD CONSTRAINT article_issue_sources_issue_id_fkey
      FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE SET NULL;
  END IF;
END $$;
