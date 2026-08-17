/*
# Fix admin_storage_upload to not set path_tokens (it's a generated column)
*/

CREATE OR REPLACE FUNCTION public.admin_storage_upload(p_bucket text, p_path text, p_owner uuid, p_content_type text, p_size integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  INSERT INTO storage.objects (bucket_id, name, owner, metadata, owner_id)
  VALUES (
    p_bucket,
    p_path,
    p_owner,
    jsonb_build_object('size', p_size, 'mimetype', p_content_type),
    p_owner::text
  )
  ON CONFLICT (bucket_id, name) DO UPDATE SET metadata = EXCLUDED.metadata;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_storage_upload(text, text, uuid, text, integer) TO anon, authenticated;