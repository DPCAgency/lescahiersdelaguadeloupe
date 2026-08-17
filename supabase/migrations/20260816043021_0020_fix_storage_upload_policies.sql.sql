/*
# Fix storage upload: Replace temp policy with proper anon upload policy

The previous temp policy didn't work because Supabase Storage's RLS
requires the policy to match the actual request context.
*/

DROP POLICY IF EXISTS imports_private_anon_write_temp ON storage.objects;

-- Allow anon to upload to imports-private (for initial admin setup)
CREATE POLICY "imports_private_setup_write"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'imports-private');

-- Also allow anon to read from imports-private (for signed URL generation)
CREATE POLICY "imports_private_setup_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'imports-private');