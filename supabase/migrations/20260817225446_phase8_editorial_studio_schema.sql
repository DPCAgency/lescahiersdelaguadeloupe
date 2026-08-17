/*
# Phase 8 — Editorial Studio: page_blocks table + issues columns

1. New Tables
- `page_blocks`: editorial blocks placed on issue pages (manual layout studio)
  - id (uuid PK)
  - issue_id (FK → issues)
  - page_number (integer)
  - block_type (text: heading, subheading, paragraph, image, quote, key_figure, separator, sidebar, timeline, caption, source)
  - position (integer, ordering within page)
  - content_json (jsonb: { text, imageUrl, caption, credit, alignment, fontSize, color, margins, articleId, ... })
  - created_at, updated_at

2. Modified Tables
- `issues`: add columns for editorial metadata
  - theme (text): main theme of the issue
  - editorial_director (text): author/direction
  - free_pages_count (integer default 1): number of free preview pages
  - download_enabled (boolean default true): PDF download toggle
  - scheduled_at (timestamptz): scheduled publication time

3. Security
- RLS enabled on page_blocks
- Admin-only CRUD (same pattern as issue_pages)
*/

ALTER TABLE issues
  ADD COLUMN IF NOT EXISTS theme text,
  ADD COLUMN IF NOT EXISTS editorial_director text,
  ADD COLUMN IF NOT EXISTS free_pages_count integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS download_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

CREATE TABLE IF NOT EXISTS page_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  page_number integer NOT NULL DEFAULT 1,
  block_type text NOT NULL DEFAULT 'paragraph',
  position integer NOT NULL DEFAULT 0,
  content_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE page_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "page_blocks_admin_all" ON page_blocks;
CREATE POLICY "page_blocks_admin_all" ON page_blocks
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = ANY(ARRAY['editor','admin','super_admin'])
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = ANY(ARRAY['editor','admin','super_admin'])
  ));

DROP POLICY IF EXISTS "page_blocks_public_read" ON page_blocks;
CREATE POLICY "page_blocks_public_read" ON page_blocks
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM issues
      WHERE issues.id = page_blocks.issue_id
      AND issues.status = 'published'
    )
  );

CREATE INDEX IF NOT EXISTS idx_page_blocks_issue_page ON page_blocks(issue_id, page_number);
CREATE INDEX IF NOT EXISTS idx_page_blocks_position ON page_blocks(issue_id, page_number, position);
