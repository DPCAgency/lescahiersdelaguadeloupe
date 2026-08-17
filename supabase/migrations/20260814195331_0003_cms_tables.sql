/*
# CMS Tables: Site Pages, Homepage Sections, Navigation, Site Settings

## Purpose
Creates the tables that make the site's institutional pages, homepage layout,
navigation menus, and global settings administrable via the future CMS.

## New Tables

### site_pages
- `id` (uuid, PK)
- `slug` (text, unique) — e.g. "notre-methode", "mentions-legales"
- `title` (text, not null)
- `content_json` (jsonb) — structured page content blocks
- `status` (text, default 'draft') — one of: draft, published
- `seo_title` (text)
- `seo_description` (text)
- `created_at`, `updated_at` (timestamptz)

### homepage_sections
- `id` (uuid, PK)
- `type` (text, not null) — one of: hero, who_decides, editorial_intro, dossier, key_figures, timeline, central_question, latest_investigations, analysis, territories, latest_issue, method, newsletter
- `position` (int, default 0) — display order
- `is_visible` (boolean, default true)
- `title` (text) — optional section title override
- `settings_json` (jsonb) — section-specific configuration
- `created_at`, `updated_at` (timestamptz)

### navigation
- `id` (uuid, PK)
- `location` (text, not null) — one of: header, footer, secondary
- `label` (text, not null) — display label
- `url` (text, not null) — link URL
- `position` (int, default 0)
- `is_visible` (boolean, default true)
- `parent_id` (uuid, self-referencing FK) — for nested menu items
- `created_at`, `updated_at` (timestamptz)

### site_settings
- `key` (text, PK) — setting key, e.g. "site_name", "subscriptions_enabled"
- `value_json` (jsonb) — setting value (supports any JSON type)
- `updated_at` (timestamptz)

## Security
- RLS enabled on all tables.
- site_pages: public read when status = 'published'; admin write.
- homepage_sections: public read when is_visible = true; admin write.
- navigation: public read when is_visible = true; admin write.
- site_settings: public read (non-sensitive settings like site_name, colors); admin write.
  Note: sensitive settings (API keys, secrets) should NOT be stored here — use edge function secrets.
*/

-- =========================================================
-- SITE_PAGES
-- =========================================================
CREATE TABLE IF NOT EXISTS site_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content_json jsonb,
  status text NOT NULL DEFAULT 'draft',
  seo_title text,
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_pages_public_read" ON site_pages;
CREATE POLICY "site_pages_public_read" ON site_pages FOR SELECT
  TO anon, authenticated USING (status = 'published');

DROP POLICY IF EXISTS "site_pages_admin_write" ON site_pages;
CREATE POLICY "site_pages_admin_write" ON site_pages FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')));

CREATE TRIGGER set_updated_at_site_pages
  BEFORE UPDATE ON site_pages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_site_pages_slug ON site_pages(slug);

-- =========================================================
-- HOMEPAGE_SECTIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  position int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  title text,
  settings_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "homepage_sections_public_read" ON homepage_sections;
CREATE POLICY "homepage_sections_public_read" ON homepage_sections FOR SELECT
  TO anon, authenticated USING (is_visible = true);

DROP POLICY IF EXISTS "homepage_sections_admin_write" ON homepage_sections;
CREATE POLICY "homepage_sections_admin_write" ON homepage_sections FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')));

CREATE TRIGGER set_updated_at_homepage_sections
  BEFORE UPDATE ON homepage_sections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_homepage_sections_position ON homepage_sections(position);

-- =========================================================
-- NAVIGATION
-- =========================================================
CREATE TABLE IF NOT EXISTS navigation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location text NOT NULL,
  label text NOT NULL,
  url text NOT NULL,
  position int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  parent_id uuid REFERENCES navigation(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE navigation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "navigation_public_read" ON navigation;
CREATE POLICY "navigation_public_read" ON navigation FOR SELECT
  TO anon, authenticated USING (is_visible = true);

DROP POLICY IF EXISTS "navigation_admin_write" ON navigation;
CREATE POLICY "navigation_admin_write" ON navigation FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')));

CREATE TRIGGER set_updated_at_navigation
  BEFORE UPDATE ON navigation
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_navigation_location ON navigation(location, position);

-- =========================================================
-- SITE_SETTINGS
-- =========================================================
CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value_json jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings_public_read" ON site_settings;
CREATE POLICY "site_settings_public_read" ON site_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "site_settings_admin_write" ON site_settings;
CREATE POLICY "site_settings_admin_write" ON site_settings FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')));

CREATE TRIGGER set_updated_at_site_settings
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
