/*
# Lot 2 — Issue (Cahier) Editorial Team Collaboration

## Summary
Adds multi-author collaboration on Cahiers:
- Creates `issue_collaborators` table (profiles assigned to issues with contributor/editor roles)
- Creates `issue_editorial_feedback` table (editor-to-author correction messages on issues)
- Adds workflow columns to `issues`: `submitted_at`, `validated_by`, `validated_at`
- Adds `changes_requested` to allowed issue statuses
- Adds RLS policies so authors can access/edit their assigned issues while editors/admins retain full access
- Adds indexes for performance

## New Tables
- `issue_collaborators` — profiles assigned to issues
  - id (uuid PK)
  - issue_id (uuid FK → issues.id ON DELETE CASCADE)
  - profile_id (uuid FK → profiles.id ON DELETE CASCADE)
  - role (text: 'contributor' | 'editor')
  - created_at (timestamptz DEFAULT now())
  - created_by (uuid nullable FK → profiles.id)
  - UNIQUE(issue_id, profile_id)

- `issue_editorial_feedback` — editorial correction messages on issues
  - id (uuid PK)
  - issue_id (uuid FK → issues.id ON DELETE CASCADE)
  - message (text NOT NULL)
  - created_by (uuid FK → profiles.id)
  - resolved_at (timestamptz nullable)

## Modified Tables
- `issues` — adds `submitted_at`, `validated_by`, `validated_at`

## Security
- `issue_collaborators` RLS: authors see collaborators on their issues; editors/admins see all
- `issue_editorial_feedback` RLS: authors read feedback on their issues; editors/admins create/manage
- `issues` RLS: adds author SELECT/UPDATE for assigned issues (via issue_collaborators); keeps existing admin/editor full access and public read
- `page_blocks`, `issue_pages`, `issue_assets` RLS: adds author access for assigned issues

## Non-regression
- admin/super_admin retain ALL existing rights (no policy removed, only new policies added)
- editor retains ALL existing rights
- Old issues without collaborators remain accessible to editors/admins
- Articles workflow from Lot 1 is not modified
*/

-- =====================================================
-- 1. ISSUES: add workflow columns
-- =====================================================

ALTER TABLE issues ADD COLUMN IF NOT EXISTS submitted_at timestamptz;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS validated_at timestamptz;

-- Add status constraint including changes_requested
DO $$ BEGIN
  EXECUTE 'ALTER TABLE issues ADD CONSTRAINT issues_status_check CHECK (status IN (''draft'', ''review'', ''changes_requested'', ''ready'', ''scheduled'', ''published'', ''archived''))';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. ISSUE_COLLABORATORS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS issue_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'contributor',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(issue_id, profile_id)
);

ALTER TABLE issue_collaborators ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. ISSUE_EDITORIAL_FEEDBACK TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS issue_editorial_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE issue_editorial_feedback ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_issue_collaborators_issue_id ON issue_collaborators(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_collaborators_profile_id ON issue_collaborators(profile_id);
CREATE INDEX IF NOT EXISTS idx_issue_editorial_feedback_issue_id ON issue_editorial_feedback(issue_id);

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

-- Helper: admin check
-- admin or super_admin => full access always

-- ---- ISSUES ----
-- Keep existing admin_write and public_read policies.
-- ADD: authors can SELECT issues they're assigned to (via issue_collaborators)
CREATE POLICY "issues_author_select"
ON issues FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM issue_collaborators ic
    WHERE ic.issue_id = issues.id AND ic.profile_id = auth.uid()
  )
);

-- ADD: authors can UPDATE issues they're assigned to (content only, WITH CHECK limits status)
CREATE POLICY "issues_author_update"
ON issues FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM issue_collaborators ic
    WHERE ic.issue_id = issues.id AND ic.profile_id = auth.uid()
  )
)
WITH CHECK (
  status IN ('draft', 'review', 'changes_requested')
  AND EXISTS (
    SELECT 1 FROM issue_collaborators ic
    WHERE ic.issue_id = issues.id AND ic.profile_id = auth.uid()
  )
);

-- ---- ISSUE_COLLABORATORS ----
-- Authors can see collaborators on their assigned issues; editors/admins see all
CREATE POLICY "issue_collaborators_select"
ON issue_collaborators FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
  )
  OR profile_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM issue_collaborators ic2
    WHERE ic2.issue_id = issue_collaborators.issue_id AND ic2.profile_id = auth.uid()
  )
);

-- Only editors/admins can insert/update/delete collaborators
CREATE POLICY "issue_collaborators_insert"
ON issue_collaborators FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
  )
);

CREATE POLICY "issue_collaborators_update"
ON issue_collaborators FOR UPDATE
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

CREATE POLICY "issue_collaborators_delete"
ON issue_collaborators FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
  )
);

-- ---- ISSUE_EDITORIAL_FEEDBACK ----
-- Authors read feedback on their assigned issues; editors/admins full access
CREATE POLICY "issue_editorial_feedback_select"
ON issue_editorial_feedback FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
  )
  OR EXISTS (
    SELECT 1 FROM issue_collaborators ic
    WHERE ic.issue_id = issue_editorial_feedback.issue_id AND ic.profile_id = auth.uid()
  )
);

CREATE POLICY "issue_editorial_feedback_insert"
ON issue_editorial_feedback FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
  )
);

CREATE POLICY "issue_editorial_feedback_update"
ON issue_editorial_feedback FOR UPDATE
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

CREATE POLICY "issue_editorial_feedback_delete"
ON issue_editorial_feedback FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin', 'super_admin')
  )
);

-- ---- PAGE_BLOCKS ----
-- Keep existing admin_write and public_read.
-- ADD: authors can SELECT/INSERT/UPDATE/DELETE page_blocks on their assigned issues
CREATE POLICY "page_blocks_author_select"
ON page_blocks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM issue_collaborators ic
    WHERE ic.issue_id = page_blocks.issue_id AND ic.profile_id = auth.uid()
  )
);

CREATE POLICY "page_blocks_author_insert"
ON page_blocks FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM issue_collaborators ic
    WHERE ic.issue_id = page_blocks.issue_id AND ic.profile_id = auth.uid()
  )
);

CREATE POLICY "page_blocks_author_update"
ON page_blocks FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM issue_collaborators ic
    WHERE ic.issue_id = page_blocks.issue_id AND ic.profile_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM issue_collaborators ic
    WHERE ic.issue_id = page_blocks.issue_id AND ic.profile_id = auth.uid()
  )
);

CREATE POLICY "page_blocks_author_delete"
ON page_blocks FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM issue_collaborators ic
    WHERE ic.issue_id = page_blocks.issue_id AND ic.profile_id = auth.uid()
  )
);

-- ---- ISSUE_PAGES ----
-- ADD: authors can access issue_pages on their assigned issues
CREATE POLICY "issue_pages_author_select"
ON issue_pages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM issue_collaborators ic
    WHERE ic.issue_id = issue_pages.issue_id AND ic.profile_id = auth.uid()
  )
);

CREATE POLICY "issue_pages_author_insert"
ON issue_pages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM issue_collaborators ic
    WHERE ic.issue_id = issue_pages.issue_id AND ic.profile_id = auth.uid()
  )
);

CREATE POLICY "issue_pages_author_update"
ON issue_pages FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM issue_collaborators ic
    WHERE ic.issue_id = issue_pages.issue_id AND ic.profile_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM issue_collaborators ic
    WHERE ic.issue_id = issue_pages.issue_id AND ic.profile_id = auth.uid()
  )
);

CREATE POLICY "issue_pages_author_delete"
ON issue_pages FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM issue_collaborators ic
    WHERE ic.issue_id = issue_pages.issue_id AND ic.profile_id = auth.uid()
  )
);

-- ---- ISSUE_ASSETS ----
-- ADD: authors can access issue_assets on their assigned issues
CREATE POLICY "issue_assets_author_select"
ON issue_assets FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM issue_collaborators ic
    WHERE ic.issue_id = issue_assets.issue_id AND ic.profile_id = auth.uid()
  )
);

CREATE POLICY "issue_assets_author_insert"
ON issue_assets FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM issue_collaborators ic
    WHERE ic.issue_id = issue_assets.issue_id AND ic.profile_id = auth.uid()
  )
);

CREATE POLICY "issue_assets_author_update"
ON issue_assets FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM issue_collaborators ic
    WHERE ic.issue_id = issue_assets.issue_id AND ic.profile_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM issue_collaborators ic
    WHERE ic.issue_id = issue_assets.issue_id AND ic.profile_id = auth.uid()
  )
);

CREATE POLICY "issue_assets_author_delete"
ON issue_assets FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM issue_collaborators ic
    WHERE ic.issue_id = issue_assets.issue_id AND ic.profile_id = auth.uid()
  )
);
