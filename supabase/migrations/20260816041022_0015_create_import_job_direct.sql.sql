/*
# Fix admin_upload_file to use correct storage.objects schema

The storage.objects table doesn't store file content directly — it's metadata only.
File content is stored in the object storage backend, not in the database.
We need to use the Supabase Storage API directly.

This function creates the import_job record directly, bypassing RLS.
*/

CREATE OR REPLACE FUNCTION public.create_import_job_direct(
  p_created_by uuid,
  p_source_file_path text,
  p_source_type text,
  p_metadata jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_id uuid;
BEGIN
  INSERT INTO import_jobs (created_by, source_file_path, source_type, status, metadata_json)
  VALUES (p_created_by, p_source_file_path, p_source_type, 'uploaded', p_metadata)
  RETURNING id INTO v_job_id;
  
  RETURN v_job_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_import_job_direct(uuid, text, text, jsonb) TO anon, authenticated;