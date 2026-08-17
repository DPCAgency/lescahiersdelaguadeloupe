/*
# Create function to upload file to storage via SQL

Inserts directly into storage.objects to register the file.
The actual file content is stored via the storage API, but we can
register the object metadata via SQL.
*/

CREATE OR REPLACE FUNCTION public.admin_storage_upload(p_bucket text, p_path text, p_owner uuid, p_content_type text, p_size integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  INSERT INTO storage.objects (bucket_id, name, owner, metadata, path_tokens, owner_id)
  VALUES (
    p_bucket,
    p_path,
    p_owner,
    jsonb_build_object('size', p_size, 'mimetype', p_content_type),
    string_to_array(p_path, '/'),
    p_owner::text
  )
  ON CONFLICT (bucket_id, name) DO UPDATE SET metadata = EXCLUDED.metadata;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_storage_upload(text, text, uuid, text, integer) TO anon, authenticated;