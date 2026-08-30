/*
# Temporary: Allow anon upload to imports-private for initial setup

This policy allows uploading to imports-private without authentication.
It will be removed after the initial PDF upload.
*/

CREATE POLICY "imports_private_anon_write_temp"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'imports-private');