/*
# Lot Pages Institutionnelles: contact_requests and right_of_reply_requests

1. New Tables
- `contact_requests`: stores messages submitted via the public /contact form.
  - id (uuid, PK)
  - name (text, not null): requester's last name
  - first_name (text): requester's first name
  - email (text, not null): requester's email
  - phone (text): optional phone number
  - subject (text, not null): reason for contact (information, proposition, question, partenariat, technique, donnees, autre)
  - message (text, not null): the message body
  - status (text, not null, default 'new'): new, in_progress, processed, archived
  - processed_at (timestamptz, nullable): when the request was processed
  - processed_by (uuid, nullable): admin who processed it (references profiles.id)
  - created_at (timestamptz, default now())

- `right_of_reply_requests`: stores right-of-reply submissions from the public /droit-de-reponse form.
  - id (uuid, PK)
  - name (text, not null): requester's last name
  - first_name (text): requester's first name
  - organization (text): optional organization
  - position (text): optional job title
  - email (text, not null): requester's email
  - phone (text): optional phone
  - article_url (text, not null): URL of the article concerned
  - subject (text, not null): short description of the request
  - message (text, not null): detailed request
  - attachment_path (text, nullable): path to optional attachment in storage
  - certified (boolean, not null, default false): requester certified accuracy
  - status (text, not null, default 'new'): new, in_review, processed, rejected, archived
  - processed_at (timestamptz, nullable)
  - processed_by (uuid, nullable, references profiles.id)
  - created_at (timestamptz, default now())

2. Security
- Both tables: RLS enabled.
- INSERT: allow anon + authenticated (public can submit forms without logging in).
- SELECT/UPDATE: restricted to authenticated users with role editor, admin, or super_admin (via profiles table check).
- No DELETE policy (requests are archived, not deleted).

3. Seed Data
- Insert 5 published site_pages rows for mentions-legales, politique-confidentialite, redaction, droit-de-reponse, contact.
  Each page has a title, slug, status='published', seo_title, seo_description, and placeholder content_json.
  The content is intentionally minimal and factual. Admin can edit via /admin/pages.
*/

-- ============================================================
-- contact_requests
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  first_name text,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'processed', 'archived')),
  processed_at timestamptz,
  processed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_contact_requests" ON contact_requests;
CREATE POLICY "anon_insert_contact_requests" ON contact_requests FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "staff_select_contact_requests" ON contact_requests;
CREATE POLICY "staff_select_contact_requests" ON contact_requests FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin') AND profiles.status = 'active')
  );

DROP POLICY IF EXISTS "staff_update_contact_requests" ON contact_requests;
CREATE POLICY "staff_update_contact_requests" ON contact_requests FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin') AND profiles.status = 'active')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin') AND profiles.status = 'active')
  );

CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at ON contact_requests(created_at DESC);

-- ============================================================
-- right_of_reply_requests
-- ============================================================
CREATE TABLE IF NOT EXISTS right_of_reply_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  first_name text,
  organization text,
  position text,
  email text NOT NULL,
  phone text,
  article_url text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  attachment_path text,
  certified boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_review', 'processed', 'rejected', 'archived')),
  processed_at timestamptz,
  processed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE right_of_reply_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_right_of_reply" ON right_of_reply_requests;
CREATE POLICY "anon_insert_right_of_reply" ON right_of_reply_requests FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "staff_select_right_of_reply" ON right_of_reply_requests;
CREATE POLICY "staff_select_right_of_reply" ON right_of_reply_requests FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin') AND profiles.status = 'active')
  );

DROP POLICY IF EXISTS "staff_update_right_of_reply" ON right_of_reply_requests;
CREATE POLICY "staff_update_right_of_reply" ON right_of_reply_requests FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin') AND profiles.status = 'active')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin') AND profiles.status = 'active')
  );

CREATE INDEX IF NOT EXISTS idx_right_of_reply_status ON right_of_reply_requests(status);
CREATE INDEX IF NOT EXISTS idx_right_of_reply_created_at ON right_of_reply_requests(created_at DESC);

-- ============================================================
-- Seed institutional site_pages (only if they don't already exist)
-- ============================================================
INSERT INTO site_pages (slug, title, content_json, status, seo_title, seo_description)
SELECT 'mentions-legales', 'Mentions légales', '{}'::jsonb, 'published', 'Mentions légales | Les Cahiers de la Guadeloupe', 'Mentions légales de la publication Les Cahiers de la Guadeloupe.'
WHERE NOT EXISTS (SELECT 1 FROM site_pages WHERE slug = 'mentions-legales');

INSERT INTO site_pages (slug, title, content_json, status, seo_title, seo_description)
SELECT 'politique-confidentialite', 'Politique de confidentialité', '{}'::jsonb, 'published', 'Politique de confidentialité | Les Cahiers de la Guadeloupe', 'Politique de confidentialité de la publication Les Cahiers de la Guadeloupe.'
WHERE NOT EXISTS (SELECT 1 FROM site_pages WHERE slug = 'politique-confidentialite');

INSERT INTO site_pages (slug, title, content_json, status, seo_title, seo_description)
SELECT 'redaction', 'La rédaction', '{}'::jsonb, 'published', 'La rédaction | Les Cahiers de la Guadeloupe', 'Présentation de la rédaction des Cahiers de la Guadeloupe.'
WHERE NOT EXISTS (SELECT 1 FROM site_pages WHERE slug = 'redaction');

INSERT INTO site_pages (slug, title, content_json, status, seo_title, seo_description)
SELECT 'droit-de-reponse', 'Droit de réponse', '{}'::jsonb, 'published', 'Droit de réponse | Les Cahiers de la Guadeloupe', 'Procédure de droit de réponse de la publication Les Cahiers de la Guadeloupe.'
WHERE NOT EXISTS (SELECT 1 FROM site_pages WHERE slug = 'droit-de-reponse');

INSERT INTO site_pages (slug, title, content_json, status, seo_title, seo_description)
SELECT 'contact', 'Contacter la rédaction', '{}'::jsonb, 'published', 'Contact | Les Cahiers de la Guadeloupe', 'Contacter la rédaction des Cahiers de la Guadeloupe.'
WHERE NOT EXISTS (SELECT 1 FROM site_pages WHERE slug = 'contact');
