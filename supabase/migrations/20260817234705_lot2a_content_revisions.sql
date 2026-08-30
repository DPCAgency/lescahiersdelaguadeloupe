/*
# Lot 2A — Content revisions table + articles.scheduled_at

1. New Tables
- `content_revisions`: stores snapshots of editorial content for restore/audit
  - id (uuid PK)
  - resource_type (text: 'issue' | 'page' | 'article')
  - resource_id (uuid)
  - snapshot_json (jsonb: full content snapshot)
  - created_by (uuid, references profiles)
  - created_at (timestamptz)

2. Modified Tables
- `articles`: add `scheduled_at` (timestamptz, nullable) for scheduled publication

3. Security
- RLS enabled on content_revisions
- Admin-only CRUD (editor/admin/super_admin)
*/

ALTER TABLE articles ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

CREATE TABLE IF NOT EXISTS content_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  snapshot_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE content_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_revisions_admin_all" ON content_revisions;
CREATE POLICY "content_revisions_admin_all" ON content_revisions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = ANY(ARRAY['editor','admin','super_admin'])
      AND profiles.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = ANY(ARRAY['editor','admin','super_admin'])
      AND profiles.status = 'active'
    )
  );

CREATE INDEX IF NOT EXISTS idx_content_revisions_resource ON content_revisions(resource_type, resource_id, created_at DESC);
