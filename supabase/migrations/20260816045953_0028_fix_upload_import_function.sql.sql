/*
# Fix upload_import_file function - correct storage.objects columns

## Problem
The previous version used a non-existent column `created_bytes`.
The actual storage.objects table has: id, bucket_id, name, owner,
created_at, updated_at, last_accessed_at, metadata, path_tokens,
version, owner_id, user_metadata.

## Fix
Removed `created_bytes` from the INSERT. The file size is stored in
the metadata JSON instead.
*/

CREATE OR REPLACE FUNCTION public.upload_import_file(
  p_file_data text,
  p_mime_type text,
  p_original_filename text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_admin_id uuid;
  v_ext text;
  v_path text;
  v_size int;
  v_decoded bytea;
BEGIN
  SELECT id INTO v_admin_id FROM profiles
  WHERE role = 'super_admin' AND status = 'active'
  ORDER BY created_at ASC LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No active super_admin found';
  END IF;

  v_ext := CASE p_mime_type
    WHEN 'application/pdf' THEN 'pdf'
    WHEN 'image/png' THEN 'png'
    WHEN 'image/jpeg' THEN 'jpg'
    ELSE 'bin'
  END;

  v_path := v_admin_id || '/' || extract(epoch from now())::bigint || '/original.' || v_ext;

  v_decoded := decode(p_file_data, 'base64');
  v_size := length(v_decoded);

  INSERT INTO storage.objects (bucket_id, name, owner, metadata)
  VALUES ('imports-private', v_path, v_admin_id, jsonb_build_object(
    'mimetype', p_mime_type,
    'size', v_size,
    'original_filename', p_original_filename
  ));

  RETURN jsonb_build_object(
    'path', v_path,
    'size', v_size,
    'admin_id', v_admin_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.upload_import_file(text, text, text) TO anon, authenticated;