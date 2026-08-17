/*
# Create function to insert extracted blocks bypassing RLS

Allows the import analysis to insert blocks without requiring auth.uid() match.
*/

CREATE OR REPLACE FUNCTION public.insert_extracted_blocks(p_blocks jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO extracted_blocks (
    import_job_id, page_number, type, source_text,
    bounding_box_json, confidence, asset_path, status
  )
  SELECT
    (b->>'import_job_id')::uuid,
    (b->>'page_number')::integer,
    b->>'type',
    b->>'source_text',
    (b->>'bounding_box_json')::jsonb,
    (b->>'confidence')::numeric,
    NULLIF(b->>'asset_path', '')::text,
    'pending'
  FROM jsonb_array_elements(p_blocks) AS b;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_extracted_blocks(jsonb) TO anon, authenticated;

-- Also create function to insert suggestions
CREATE OR REPLACE FUNCTION public.insert_ai_suggestions(p_suggestions jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO ai_suggestions (import_job_id, suggestion_type, suggestion_json, status)
  SELECT
    (s->>'import_job_id')::uuid,
    s->>'suggestion_type',
    (s->>'suggestion_json')::jsonb,
    'pending'
  FROM jsonb_array_elements(p_suggestions) AS s;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_ai_suggestions(jsonb) TO anon, authenticated;

-- Function to update job status
CREATE OR REPLACE FUNCTION public.update_import_job_status(p_job_id uuid, p_status text, p_progress integer, p_page_count integer DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE import_jobs SET 
    status = p_status,
    progress = p_progress,
    page_count = COALESCE(p_page_count, page_count),
    completed_at = CASE WHEN p_status IN ('needs_review', 'validated', 'failed') THEN now() ELSE completed_at END
  WHERE id = p_job_id;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_import_job_status(uuid, text, integer, integer) TO anon, authenticated;