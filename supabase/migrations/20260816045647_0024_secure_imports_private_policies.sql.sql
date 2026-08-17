/*
# Secure imports-private Storage bucket

## Problem
Two temporary permissive policies (`imports_private_setup_read` and
`imports_private_setup_write`) allowed the `anon` role to read and
write to the `imports-private` bucket without any authentication or
role check. This made the private bucket effectively public.

## Changes
1. Drop `imports_private_setup_read` (anon SELECT on all objects)
2. Drop `imports_private_setup_write` (anon INSERT on all objects)
3. Add `imports_private_update` policy for authenticated
   editor/admin/super_admin users (was missing)

## Security
- The remaining policies require `auth.uid()` to match a `profiles`
  row with role IN ('editor', 'admin', 'super_admin').
- Anon role has NO access to `imports-private` objects.
- RLS remains enabled.
- The bucket stays `public = false`.
*/

DROP POLICY IF EXISTS "imports_private_setup_read" ON storage.objects;
DROP POLICY IF EXISTS "imports_private_setup_write" ON storage.objects;

DROP POLICY IF EXISTS "imports_private_update" ON storage.objects;
CREATE POLICY "imports_private_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'imports-private'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('editor', 'admin', 'super_admin')
  )
)
WITH CHECK (
  bucket_id = 'imports-private'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('editor', 'admin', 'super_admin')
  )
);