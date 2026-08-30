CREATE OR REPLACE FUNCTION get_import_job(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', id,
    'source_file_path', source_file_path,
    'source_type', source_type,
    'status', status,
    'page_count', page_count,
    'progress', progress,
    'error_message', error_message,
    'created_at', created_at,
    'metadata_json', metadata_json,
    'total_pages', total_pages,
    'processed_pages', processed_pages,
    'failed_pages', failed_pages,
    'current_page', current_page,
    'processing_started_at', processing_started_at,
    'processing_completed_at', processing_completed_at,
    'last_error', last_error
  ) INTO v_result FROM import_jobs WHERE id = p_job_id;
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_import_job(uuid) TO authenticated;
