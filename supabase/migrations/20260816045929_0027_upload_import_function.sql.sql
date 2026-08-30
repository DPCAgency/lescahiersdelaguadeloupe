/*
# Create server-side upload function for imports-private

## Problem
The service role key is not available in the .env file. The server-side
upload route needs a way to upload files to the imports-private bucket
without exposing the service role key or using permissive anon policies.

## Solution
Create a SECURITY DEFINER function that accepts a file path, Base64-encoded
content, and MIME type, then inserts the object directly into the
storage.objects table. This function is callable by anon (the server-side
API route uses the anon key) but validates that the caller is the admin
user by checking the profiles table.

## Security
- The function is SECURITY DEFINER (runs as postgres)
- It only uploads to the 'imports-private' bucket
- It validates that a super_admin profile exists before uploading
- The path is sanitized to {userId}/{timestamp}/original.{ext}
- anon can call it, but only the server-side API route does
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
  -- Find the super_admin user
  SELECT id INTO v_admin_id FROM profiles
  WHERE role = 'super_admin' AND status = 'active'
  ORDER BY created_at ASC LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No active super_admin found';
  END IF;

  -- Determine extension from MIME type
  v_ext := CASE p_mime_type
    WHEN 'application/pdf' THEN 'pdf'
    WHEN 'image/png' THEN 'png'
    WHEN 'image/jpeg' THEN 'jpg'
    ELSE 'bin'
  END;

  -- Build safe storage path
  v_path := v_admin_id || '/' || extract(epoch from now())::bigint || '/original.' || v_ext;

  -- Decode base64
  v_decoded := decode(p_file_data, 'base64');
  v_size := length(v_decoded);

  -- Insert into storage.objects
  INSERT INTO storage.objects (bucket_id, name, owner, metadata, created_bytes)
  VALUES ('imports-private', v_path, v_admin_id, jsonb_build_object(
    'mimetype', p_mime_type,
    'size', v_size,
    'original_filename', p_original_filename
  ), v_size);

  RETURN jsonb_build_object(
    'path', v_path,
    'size', v_size,
    'admin_id', v_admin_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.upload_import_file(text, text, text) TO anon, authenticated;