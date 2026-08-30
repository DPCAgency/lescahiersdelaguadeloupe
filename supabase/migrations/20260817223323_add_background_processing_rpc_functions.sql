-- Function to update import job progress (for background processing)
CREATE OR REPLACE FUNCTION update_import_job_progress(
  p_job_id uuid,
  p_status text DEFAULT NULL,
  p_progress integer DEFAULT NULL,
  p_total_pages integer DEFAULT NULL,
  p_processed_pages integer DEFAULT NULL,
  p_failed_pages integer DEFAULT NULL,
  p_current_page integer DEFAULT NULL,
  p_error_message text DEFAULT NULL,
  p_last_error text DEFAULT NULL,
  p_metadata_merge jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_metadata jsonb;
BEGIN
  -- Get existing metadata if we need to merge
  IF p_metadata_merge IS NOT NULL THEN
    SELECT metadata_json INTO v_existing_metadata FROM import_jobs WHERE id = p_job_id;
    IF v_existing_metadata IS NULL THEN
      v_existing_metadata := '{}'::jsonb;
    END IF;
  END IF;

  UPDATE import_jobs SET
    status = COALESCE(p_status, status),
    progress = COALESCE(p_progress, progress),
    total_pages = COALESCE(p_total_pages, total_pages),
    processed_pages = COALESCE(p_processed_pages, processed_pages),
    failed_pages = COALESCE(p_failed_pages, failed_pages),
    current_page = COALESCE(p_current_page, current_page),
    error_message = COALESCE(p_error_message, error_message),
    last_error = COALESCE(p_last_error, last_error),
    metadata_json = CASE 
      WHEN p_metadata_merge IS NOT NULL THEN v_existing_metadata || p_metadata_merge
      ELSE metadata_json
    END,
    processing_started_at = CASE 
      WHEN p_status = 'processing' AND processing_started_at IS NULL THEN now()
      ELSE processing_started_at
    END,
    processing_completed_at = CASE 
      WHEN p_status IN ('needs_review', 'completed', 'failed') THEN now()
      ELSE processing_completed_at
    END
  WHERE id = p_job_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_import_job_progress(
  uuid, text, integer, integer, integer, integer, integer, text, text, jsonb
) TO anon, authenticated;

-- Function to insert ai_suggestions for a job (for background processing)
CREATE OR REPLACE FUNCTION insert_ai_suggestions(
  p_job_id uuid,
  p_suggestions jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO ai_suggestions (import_job_id, suggestion_type, suggestion_json, status)
  SELECT 
    p_job_id,
    'article_grouping',
    elem->>'suggestion_json',
    'pending'
  FROM jsonb_array_elements(p_suggestions) AS elem;
END;
$$;

GRANT EXECUTE ON FUNCTION insert_ai_suggestions(uuid, jsonb) TO anon, authenticated;
