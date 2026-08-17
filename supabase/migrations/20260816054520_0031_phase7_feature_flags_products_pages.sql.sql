/*
# Phase 7 — Feature flags, product for N02, and issue page storage paths

## Changes
1. Create `feature_flags` table for global commerce configuration
2. Seed feature flags: subscriptions_enabled=false, page_purchase_enabled=true,
   full_issue_purchase_enabled=true, pdf_download_enabled=true
3. Create a product for the N02 issue (type=issue, price=2.90 EUR)
4. Update issue_pages for N02 with real storage paths from the import job
   (thumbnails, previews, full pages in imports-private bucket)

## Security
- feature_flags: RLS enabled, readable by anon+authenticated (public config),
  writable by authenticated admin only
- products: RLS enabled, readable by anon+authenticated, writable by admin
- entitlements: RLS enabled, readable by owner + admin, writable by admin/edge function
- reading_progress: RLS enabled, readable/writable by owner only

## Notes
- The import job ID for N02 is ee243f47-70e1-4194-9c71-c6dfdaf9f4c0
- Storage paths follow the pattern: {jobId}/{thumbnails|previews|full}/page-XX.png
*/

-- 1. Feature flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key text PRIMARY KEY,
  value boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feature_flags_read_all" ON public.feature_flags;
CREATE POLICY "feature_flags_read_all" ON public.feature_flags FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "feature_flags_admin_write" ON public.feature_flags;
CREATE POLICY "feature_flags_admin_write" ON public.feature_flags FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

-- Seed feature flags
INSERT INTO public.feature_flags (key, value) VALUES
  ('subscriptions_enabled', false),
  ('page_purchase_enabled', true),
  ('full_issue_purchase_enabled', true),
  ('pdf_download_enabled', true)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Create product for N02
INSERT INTO public.products (type, resource_id, name, description, price, currency, is_active)
VALUES (
  'issue',
  '7db92925-8d2c-4044-9f12-6facd04c5bef',
  'Cahier N°02 — Qui gouverne réellement Le Gosier ?',
  'Accès complet au Cahier N°02 (11 pages) + téléchargement PDF',
  2.90,
  'EUR',
  true
)
ON CONFLICT DO NOTHING;

-- 3. Update issue_pages with real storage paths
UPDATE public.issue_pages SET
  preview_image_path = 'ee243f47-70e1-4194-9c71-c6dfdaf9f4c0/previews/page-01.png',
  full_image_path = 'ee243f47-70e1-4194-9c71-c6dfdaf9f4c0/full/page-01.png'
WHERE issue_id = '7db92925-8d2c-4044-9f12-6facd04c5bef' AND page_number = 1;

UPDATE public.issue_pages SET
  preview_image_path = 'ee243f47-70e1-4194-9c71-c6dfdaf9f4c0/previews/page-02.png',
  full_image_path = 'ee243f47-70e1-4194-9c71-c6dfdaf9f4c0/full/page-02.png'
WHERE issue_id = '7db92925-8d2c-4044-9f12-6facd04c5bef' AND page_number = 2;

UPDATE public.issue_pages SET
  preview_image_path = 'ee243f47-70e1-4194-9c71-c6dfdaf9f4c0/previews/page-03.png',
  full_image_path = 'ee243f47-70e1-4194-9c71-c6dfdaf9f4c0/full/page-03.png'
WHERE issue_id = '7db92925-8d2c-4044-9f12-6facd04c5bef' AND page_number = 3;

UPDATE public.issue_pages SET
  preview_image_path = 'ee243f47-70e1-4194-9c71-c6dfdaf9f4c0/previews/page-04.png',
  full_image_path = 'ee243f47-70e1-4194-9c71-c6dfdaf9f4c0/full/page-04.png'
WHERE issue_id = '7db92925-8d2c-4044-9f12-6facd04c5bef' AND page_number = 4;

UPDATE public.issue_pages SET
  preview_image_path = 'ee243f47-70e1-4194-9c71-c6dfdaf9f4c0/previews/page-05.png',
  full_image_path = 'ee243f47-70e1-4194-9c71-c6dfdaf9f4c0/full/page-05.png'
WHERE issue_id = '7db92925-8d2c-4044-9f12-6facd04c5bef' AND page_number = 5;

UPDATE public.issue_pages SET
  preview_image_path = 'ee243f47-70e1-4194-9c71-c6dfdaf9f4c0/previews/page-06.png',
  full_image_path = 'ee243f47-70e1-4194-9c71-c6dfdaf9f4c0/full/page-06.png'
WHERE issue_id = '7db92925-8d2c-4044-9f12-6facd04c5bef' AND page_number = 6;

UPDATE public.issue_pages SET
  preview_image_path = 'ee243f47-70e1-4194-9c71-c6dfdaf9f4c0/previews/page-07.png',
  full_image_path = 'ee243f47-70e1-4194-9c71-c6dfdaf9f4c0/full/page-07.png'
WHERE issue_id = '7db92925-8d2c-4044-9f12-6facd04c5bef' AND page_number = 7;

UPDATE public.issue_pages SET
  preview_image_path = 'ee243f47-70e1-4194-9c71-c6dfdaf9f4c0/previews/page-08.png',
  full_image_path = 'ee243f47-70e1-4194-9c71-c6dfdaf9f4c0/full/page-08.png'
WHERE issue_id = '7db92925-8d2c-4044-9f12-6facd04c5bef' AND page_number = 8;

UPDATE public.issue_pages SET
  preview_image_path = 'ee243f47-70e1-4194-9c71-c6dfdaf9f4c0/previews/page-09.png',
  full_image_path = 'ee243f47-70e1-4194-9c71-c6dfdaf9f4c0/full/page-09.png'
WHERE issue_id = '7db92925-8d2c-4044-9f12-6facd04c5bef' AND page_number = 9;

UPDATE public.issue_pages SET
  preview_image_path = 'ee243f47-70e1-4194-9c71-c6dfdaf9f4c0/previews/page-10.png',
  full_image_path = 'ee243f47-70e1-4194-9c71-c6dfdaf9f4c0/full/page-10.png'
WHERE issue_id = '7db92925-8d2c-4044-9f12-6facd04c5bef' AND page_number = 10;

UPDATE public.issue_pages SET
  preview_image_path = 'ee243f47-70e1-4194-9c71-c6dfdaf9f4c0/previews/page-11.png',
  full_image_path = 'ee243f47-70e1-4194-9c71-c6dfdaf9f4c0/full/page-11.png'
WHERE issue_id = '7db92925-8d2c-4044-9f12-6facd04c5bef' AND page_number = 11;