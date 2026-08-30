/*
# Raise imports-private bucket upload limit to 100 MB

## Purpose
The `imports-private` bucket was created with `file_size_limit = NULL`, which causes
Supabase Storage to apply its platform default of 5 MB. Cahier PDFs with high-res
photography routinely exceed 5 MB. This migration sets an explicit 100 MB limit and
restricts accepted MIME types to PDF, JPEG, and PNG.

## Changes
- `storage.buckets.file_size_limit` set to `104857600` (100 MB) for `imports-private`.
- `storage.buckets.allowed_mime_types` set to `['application/pdf', 'image/jpeg', 'image/png']`.

## Security
No policy changes — existing RLS policies on `storage.objects` remain in effect.
Only authenticated editors/admins/super_admins can write to this bucket.
*/

UPDATE storage.buckets
SET
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png']::text[]
WHERE id = 'imports-private';
