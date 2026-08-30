/*
# Multi-Author Editorial Workflow

## Summary
Adds multi-author editorial workflow to the CMS:
- Adds `author` to allowed profile roles
- Links profiles to authors via `profiles.author_id`
- Adds ownership tracking to articles: `created_by`, `submitted_at`, `validated_by`, `validated_at`
- Adds `changes_requested` to allowed article statuses
- Creates `editorial_feedback` table for editor-to-author correction messages
- Adds indexes for performance
- Updates RLS policies so authors can CRUD their own articles/blocks while editors/admins retain full access

## New Tables
- `editorial_feedback` — editorial correction messages from editors to authors
  - id (uuid PK)
  - article_id (uuid FK → articles.id ON DELETE CASCADE)
  - message (text, not null)
  - created_by (uuid FK → profiles.id)
  - resolved_at (timestamptz, nullable)

## Modified Tables
- `profiles` — adds `author_id` (uuid nullable FK → authors.id)
- `articles` — adds `created_by` (uuid nullable FK → profiles.id), `submitted_at` (timestamptz nullable), `validated_by` (uuid nullable FK → profiles.id), `validated_at` (timestamptz nullable)

## Security
- Updates `profiles` RLS: authors can read their own profile, editors/admins can read all
- Updates `articles` RLS: authors can SELECT/INSERT/UPDATE/DELETE their own drafts; editors/admins retain full access; public read stays published-only
- Updates `article_blocks`, `article_territories`, `article_issue_sources` RLS: authors can CRUD on their own articles' children
- `editorial_feedback` RLS: authors read feedback on their articles, editors/admins create/manage all
- `content_revisions` RLS: authors can read revisions on their own articles

## Important Notes
1. Existing articles with NULL `created_by` remain accessible to editors/admins
2. Authors can only delete their own draft-status articles
3. Authors cannot change status to published/scheduled/ready/archived via RLS WITH CHECK
4. The `author` role is added to the profiles check constraint without removing existing roles
*/

-- =====================================================
-- 1. PROFILES: add author_id column + author role
-- =====================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES authors(id) ON DELETE SET NULL;

-- Update the role check constraint to include 'author'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
DO $$ BEGIN
  EXECUTE 'ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN (''reader'', ''author'', ''editor'', ''admin'', ''super_admin''))';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. ARTICLES: add ownership + workflow columns
-- =====================================================

ALTER TABLE articles ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS submitted_at timestamptz;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS validated_at timestamptz;

-- Update the status check constraint to include 'changes_requested'
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_status_check;
DO $$ BEGIN
  EXECUTE 'ALTER TABLE articles ADD CONSTRAINT articles_status_check CHECK (status IN (''draft'', ''review'', ''changes_requested'', ''ready'', ''scheduled'', ''published'', ''archived''))';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 3. EDITORIAL FEEDBACK TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS editorial_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE editorial_feedback ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_articles_created_by ON articles(created_by);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_author_id ON profiles(author_id);
CREATE INDEX IF NOT EXISTS idx_editorial_feedback_article_id ON editorial_feedback(article_id);

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

-- Helper: author ownership check for articles
-- An author owns an article if articles.created_by = auth.uid()
-- Editors/admins/super_admins have full access via the admin check

-- ---- PROFILES ----
-- Authors can read their own profile; editors/admins can read all profiles
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('editor', 'admin', 'super_admin')
  )
);

-- Keep existing update-own policy
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ---- ARTICLES ----
-- SELECT: authors see their own (any status) + all published; editors/admins see all
DROP POLICY IF EXISTS "articles_admin_write" ON articles;
DROP POLICY IF EXISTS "articles_public_read" ON articles;
DROP POLICY IF EXISTS "articles_author_select" ON articles;

CREATE POLICY "articles_select_all"
ON articles FOR SELECT
TO authenticated
USING (
  status = 'published'
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
  )
);

CREATE POLICY "articles_public_read"
ON articles FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- INSERT: authors can create (created_by = themselves); editors/admins can create any
DROP POLICY IF EXISTS "articles_insert" ON articles;
CREATE POLICY "articles_insert"
ON articles FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
  )
);

-- UPDATE: authors can update their own (but not status to published/scheduled/ready/archived);
-- editors/admins can update any
DROP POLICY IF EXISTS "articles_update" ON articles;
CREATE POLICY "articles_update"
ON articles FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
  )
)
WITH CHECK (
  (
    created_by = auth.uid()
    AND status IN ('draft', 'review', 'changes_requested')
  )
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
  )
);

-- DELETE: authors can delete their own drafts only; editors/admins can delete any
DROP POLICY IF EXISTS "articles_delete" ON articles;
CREATE POLICY "articles_delete"
ON articles FOR DELETE
TO authenticated
USING (
  (
    created_by = auth.uid() AND status = 'draft'
  )
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
  )
);

-- ---- ARTICLE_BLOCKS ----
-- Authors can CRUD blocks on their own articles; editors/admins full access; public read published
DROP POLICY IF EXISTS "article_blocks_admin_write" ON articles;
DROP POLICY IF EXISTS "article_blocks_admin_write" ON article_blocks;
DROP POLICY IF EXISTS "article_blocks_public_read" ON article_blocks;

CREATE POLICY "article_blocks_select"
ON article_blocks FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM articles
    WHERE articles.id = article_blocks.article_id
    AND (articles.status = 'published' OR articles.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
      ))
  )
);

CREATE POLICY "article_blocks_insert"
ON article_blocks FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM articles
    WHERE articles.id = article_blocks.article_id
    AND (articles.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
      ))
  )
);

CREATE POLICY "article_blocks_update"
ON article_blocks FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM articles
    WHERE articles.id = article_blocks.article_id
    AND (articles.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
      ))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM articles
    WHERE articles.id = article_blocks.article_id
    AND (articles.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
      ))
  )
);

CREATE POLICY "article_blocks_delete"
ON article_blocks FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM articles
    WHERE articles.id = article_blocks.article_id
    AND (articles.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
      ))
  )
);

-- ---- ARTICLE_TERRITORIES ----
DROP POLICY IF EXISTS "article_territories_admin_write" ON article_territories;
DROP POLICY IF EXISTS "article_territories_public_read" ON article_territories;

CREATE POLICY "article_territories_select"
ON article_territories FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM articles
    WHERE articles.id = article_territories.article_id
    AND (articles.status = 'published' OR articles.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
      ))
  )
);

CREATE POLICY "article_territories_insert"
ON article_territories FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM articles
    WHERE articles.id = article_territories.article_id
    AND (articles.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
      ))
  )
);

CREATE POLICY "article_territories_update"
ON article_territories FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM articles
    WHERE articles.id = article_territories.article_id
    AND (articles.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
      ))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM articles
    WHERE articles.id = article_territories.article_id
    AND (articles.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
      ))
  )
);

CREATE POLICY "article_territories_delete"
ON article_territories FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM articles
    WHERE articles.id = article_territories.article_id
    AND (articles.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
      ))
  )
);

-- ---- ARTICLE_ISSUE_SOURCES ----
DROP POLICY IF EXISTS "article_issue_sources_admin_write" ON article_issue_sources;
DROP POLICY IF EXISTS "article_issue_sources_public_read" ON article_issue_sources;

CREATE POLICY "article_issue_sources_select"
ON article_issue_sources FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM articles
    WHERE articles.id = article_issue_sources.article_id
    AND (articles.status = 'published' OR articles.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
      ))
  )
);

CREATE POLICY "article_issue_sources_insert"
ON article_issue_sources FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM articles
    WHERE articles.id = article_issue_sources.article_id
    AND (articles.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
      ))
  )
);

CREATE POLICY "article_issue_sources_update"
ON article_issue_sources FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM articles
    WHERE articles.id = article_issue_sources.article_id
    AND (articles.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
      ))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM articles
    WHERE articles.id = article_issue_sources.article_id
    AND (articles.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
      ))
  )
);

CREATE POLICY "article_issue_sources_delete"
ON article_issue_sources FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM articles
    WHERE articles.id = article_issue_sources.article_id
    AND (articles.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
      ))
  )
);

-- ---- CONTENT_REVISIONS ----
-- Authors can read revisions on their own articles; editors/admins full access
DROP POLICY IF EXISTS "content_revisions_admin_all" ON content_revisions;

CREATE POLICY "content_revisions_select"
ON content_revisions FOR SELECT
TO authenticated
USING (
  resource_type = 'article' AND resource_id IN (
    SELECT id FROM articles WHERE created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
  )
);

CREATE POLICY "content_revisions_insert"
ON content_revisions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin', 'author')
  )
);

-- ---- EDITORIAL_FEEDBACK ----
-- Authors read feedback on their articles; editors/admins create/manage all
DROP POLICY IF EXISTS "editorial_feedback_select" ON editorial_feedback;
CREATE POLICY "editorial_feedback_select"
ON editorial_feedback FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM articles
    WHERE articles.id = editorial_feedback.article_id
    AND (articles.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
      ))
  )
);

DROP POLICY IF EXISTS "editorial_feedback_insert" ON editorial_feedback;
CREATE POLICY "editorial_feedback_insert"
ON editorial_feedback FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
  )
);

DROP POLICY IF EXISTS "editorial_feedback_update" ON editorial_feedback;
CREATE POLICY "editorial_feedback_update"
ON editorial_feedback FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
  )
);

DROP POLICY IF EXISTS "editorial_feedback_delete" ON editorial_feedback;
CREATE POLICY "editorial_feedback_delete"
ON editorial_feedback FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
  )
);
