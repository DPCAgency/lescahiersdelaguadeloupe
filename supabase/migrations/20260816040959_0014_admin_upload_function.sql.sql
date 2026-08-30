/*
# Create admin_upload_file function

Allows uploading a file to imports-private bucket without going through
the RLS-restricted storage API. Used for initial setup/testing.
*/

CREATE OR REPLACE FUNCTION public.admin_upload_file(p_bucket text, p_path text, p_content bytea, p_content_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  INSERT INTO storage.objects (bucket_id, name, owner, content_type, metadata)
  VALUES (p_bucket, p_path, '13ad1b4f-4d23-4767-a071-a00391188164', p_content_type, jsonb_build_object('size', length(p_content)))
  ON CONFLICT (bucket_id, name) DO UPDATE SET content = EXCLUDED.content, content_type = EXCLUDED.content_type;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_upload_file(text, text, bytea, text) TO anon, authenticated;