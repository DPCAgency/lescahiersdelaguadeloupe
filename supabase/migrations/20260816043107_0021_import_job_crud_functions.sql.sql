/*
# Create RPC functions for import_jobs CRUD bypassing RLS
*/

CREATE OR REPLACE FUNCTION public.list_import_jobs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN jsonb_agg(
    jsonb_build_object(
      'id', id,
      'source_file_path', source_file_path,
      'source_type', source_type,
      'status', status,
      'page_count', page_count,
      'progress', progress,
      'error_message', error_message,
      'created_at', created_at,
      'metadata_json', metadata_json
    )
    ORDER BY created_at DESC
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_import_jobs() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.delete_import_job(p_job_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM import_jobs WHERE id = p_job_id;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_import_job(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_import_job(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    'metadata_json', metadata_json
  ) INTO v_result FROM import_jobs WHERE id = p_job_id;
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_import_job(uuid) TO anon, authenticated;