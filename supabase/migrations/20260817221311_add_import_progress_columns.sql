ALTER TABLE import_jobs
  ADD COLUMN IF NOT EXISTS total_pages integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS processed_pages integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_pages integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_page integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS processing_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS processing_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error text;
