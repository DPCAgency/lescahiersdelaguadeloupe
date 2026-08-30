/*
# Import Tables: Import Jobs, Extracted Blocks, AI Suggestions

## Purpose
Creates the tables for the future intelligent import pipeline (OCR → AI analysis →
editorial validation). No OCR engine or AI is connected in this phase — these
tables prepare the data model for the workflow described in the project roadmap.

## New Tables

### import_jobs
- `id` (uuid, PK)
- `created_by` (uuid, FK → auth.users) — admin who initiated the import
- `source_file_path` (text) — path to the uploaded PDF in private storage
- `source_type` (text, default 'pdf') — one of: pdf, images
- `status` (text, default 'uploaded') — one of: uploaded, processing, needs_review, validated, failed
- `page_count` (int) — number of pages detected
- `progress` (int, default 0) — 0-100 progress indicator
- `error_message` (text)
- `metadata_json` (jsonb) — flexible metadata (file size, OCR engine, etc.)
- `created_at`, `completed_at` (timestamptz)

### extracted_blocks
- `id` (uuid, PK)
- `import_job_id` (uuid, FK → import_jobs, ON DELETE CASCADE)
- `page_number` (int) — which page of the source PDF this block was extracted from
- `type` (text) — one of: heading, subheading, paragraph, image, caption, quote, key_figure, timeline, sidebar, footer, unknown
- `source_text` (text) — original extracted text (NEVER overwritten by automation)
- `edited_text` (text) — corrected/edited version by the editorial team
- `bounding_box_json` (jsonb) — coordinates on the source page
- `confidence` (numeric, 5,4) — OCR/AI confidence score 0.0000-1.0000
- `asset_path` (text) — path to extracted image/asset in storage
- `status` (text, default 'pending') — one of: pending, validated, modified, ignored
- `created_at`, `updated_at` (timestamptz)

### ai_suggestions
- `id` (uuid, PK)
- `import_job_id` (uuid, FK → import_jobs, ON DELETE CASCADE)
- `suggestion_type` (text) — e.g. "block_type", "category", "author", "summary"
- `source_reference` (text) — reference to the source (e.g. extracted_block ID)
- `suggestion_json` (jsonb) — the AI's suggestion payload
- `status` (text, default 'pending') — one of: pending, accepted, rejected, edited
- `created_at` (timestamptz)
- `reviewed_at` (timestamptz)
- `reviewed_by` (uuid, FK → auth.users)

## Security
- RLS enabled on all tables.
- import_jobs: admin-only (editor, admin, super_admin). No public access.
- extracted_blocks: admin-only. No public access.
- ai_suggestions: admin-only. No public access.

## Key Design Rules
1. `source_text` in extracted_blocks must NEVER be overwritten by automation — it preserves the original OCR output.
2. `edited_text` is the human-corrected version that can replace source_text in published content.
3. The `status` field tracks the editorial validation workflow.
4. No OCR or AI engine is connected — these tables are structural placeholders.
*/

-- =========================================================
-- IMPORT_JOBS
-- =========================================================
CREATE TABLE IF NOT EXISTS import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source_file_path text NOT NULL,
  source_type text NOT NULL DEFAULT 'pdf',
  status text NOT NULL DEFAULT 'uploaded',
  page_count int,
  progress int NOT NULL DEFAULT 0,
  error_message text,
  metadata_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "import_jobs_admin_all" ON import_jobs;
CREATE POLICY "import_jobs_admin_all" ON import_jobs FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')));

CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(status);

-- =========================================================
-- EXTRACTED_BLOCKS
-- =========================================================
CREATE TABLE IF NOT EXISTS extracted_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id uuid NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  page_number int NOT NULL,
  type text NOT NULL DEFAULT 'unknown',
  source_text text,
  edited_text text,
  bounding_box_json jsonb,
  confidence numeric(5,4) DEFAULT 0,
  asset_path text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE extracted_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "extracted_blocks_admin_all" ON extracted_blocks;
CREATE POLICY "extracted_blocks_admin_all" ON extracted_blocks FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')));

CREATE TRIGGER set_updated_at_extracted_blocks
  BEFORE UPDATE ON extracted_blocks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_extracted_blocks_job ON extracted_blocks(import_job_id);
CREATE INDEX IF NOT EXISTS idx_extracted_blocks_page ON extracted_blocks(import_job_id, page_number);

-- =========================================================
-- AI_SUGGESTIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id uuid NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  suggestion_type text NOT NULL,
  source_reference text,
  suggestion_json jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_suggestions_admin_all" ON ai_suggestions;
CREATE POLICY "ai_suggestions_admin_all" ON ai_suggestions FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin', 'super_admin')));

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_job ON ai_suggestions(import_job_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_status ON ai_suggestions(status);
