/*
# Storage Buckets for Les Cahiers de la Guadeloupe

## Purpose
Creates the public and private storage buckets needed for the CMS.
Public buckets serve images, covers, and article images directly.
Private buckets protect premium content (full PDFs, high-res page images, documents, import files).

## Buckets Created
### Public
- `site-public` — general site assets (logo, favicon, misc images)
- `article-images` — article hero images and inline article images
- `covers` — Cahier cover images

### Private
- `issues-private` — full issue PDFs and EPUBs (premium content)
- `issue-pages-private` — high-resolution page images (premium content)
- `documents-private` — editorial source documents
- `imports-private` — uploaded PDFs for OCR/import pipeline

## Security
- Public buckets: anyone can read; only authenticated admins can write.
- Private buckets: no public access; only authenticated admins can read/write.
- Access to private bucket content for readers will be handled via signed URLs in a future phase.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('site-public', 'site-public', true),
  ('article-images', 'article-images', true),
  ('covers', 'covers', true),
  ('issues-private', 'issues-private', false),
  ('issue-pages-private', 'issue-pages-private', false),
  ('documents-private', 'documents-private', false),
  ('imports-private', 'imports-private', false)
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- STORAGE POLICIES: Public buckets (read = anyone, write = admin)
-- =========================================================

-- site-public
DROP POLICY IF EXISTS "site_public_read" ON storage.objects;
CREATE POLICY "site_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'site-public');

DROP POLICY IF EXISTS "site_public_write" ON storage.objects;
CREATE POLICY "site_public_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'site-public' AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "site_public_update" ON storage.objects;
CREATE POLICY "site_public_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'site-public' AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin'))
  )
  WITH CHECK (
    bucket_id = 'site-public' AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "site_public_delete" ON storage.objects;
CREATE POLICY "site_public_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'site-public' AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin'))
  );

-- article-images
DROP POLICY IF EXISTS "article_images_read" ON storage.objects;
CREATE POLICY "article_images_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'article-images');

DROP POLICY IF EXISTS "article_images_write" ON storage.objects;
CREATE POLICY "article_images_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'article-images' AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "article_images_update" ON storage.objects;
CREATE POLICY "article_images_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'article-images' AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin'))
  )
  WITH CHECK (
    bucket_id = 'article-images' AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "article_images_delete" ON storage.objects;
CREATE POLICY "article_images_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'article-images' AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin'))
  );

-- covers
DROP POLICY IF EXISTS "covers_read" ON storage.objects;
CREATE POLICY "covers_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'covers');

DROP POLICY IF EXISTS "covers_write" ON storage.objects;
CREATE POLICY "covers_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'covers' AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "covers_update" ON storage.objects;
CREATE POLICY "covers_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'covers' AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin'))
  )
  WITH CHECK (
    bucket_id = 'covers' AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "covers_delete" ON storage.objects;
CREATE POLICY "covers_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'covers' AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin'))
  );

-- =========================================================
-- STORAGE POLICIES: Private buckets (read + write = admin only)
-- =========================================================

-- issues-private
DROP POLICY IF EXISTS "issues_private_read" ON storage.objects;
CREATE POLICY "issues_private_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'issues-private' AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "issues_private_write" ON storage.objects;
CREATE POLICY "issues_private_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'issues-private' AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "issues_private_delete" ON storage.objects;
CREATE POLICY "issues_private_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'issues-private' AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin'))
  );

-- issue-pages-private
DROP POLICY IF EXISTS "issue_pages_private_read" ON storage.objects;
CREATE POLICY "issue_pages_private_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'issue-pages-private' AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "issue_pages_private_write" ON storage.objects;
CREATE POLICY "issue_pages_private_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'issue-pages-private' AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "issue_pages_private_delete" ON storage.objects;
CREATE POLICY "issue_pages_private_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'issue-pages-private' AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin'))
  );

-- documents-private
DROP POLICY IF EXISTS "documents_private_read" ON storage.objects;
CREATE POLICY "documents_private_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents-private' AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "documents_private_write" ON storage.objects;
CREATE POLICY "documents_private_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents-private' AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "documents_private_delete" ON storage.objects;
CREATE POLICY "documents_private_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents-private' AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin'))
  );

-- imports-private
DROP POLICY IF EXISTS "imports_private_read" ON storage.objects;
CREATE POLICY "imports_private_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'imports-private' AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "imports_private_write" ON storage.objects;
CREATE POLICY "imports_private_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'imports-private' AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "imports_private_delete" ON storage.objects;
CREATE POLICY "imports_private_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'imports-private' AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin'))
  );
