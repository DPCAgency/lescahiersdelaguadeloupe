/*
# Create verify_password function

1. New Functions
- `verify_password(hash text, plaintext text)` — returns boolean
  Uses PostgreSQL's `crypt()` function to verify a bcrypt hash against plaintext.
  This is needed because users created directly via SQL (instead of GoTrue's API)
  have passwords hashed with `crypt()` which GoTrue's auth endpoint doesn't recognize.
  The signin route falls back to this function when standard auth fails.

2. Security
- SECURITY DEFINER — runs with elevated privileges to read auth.users.encrypted_password
- The function only accepts a hash and plaintext, returns true/false. It does not expose the hash.
- No RLS needed (function-level security).
*/

CREATE OR REPLACE FUNCTION public.verify_password(hash text, plaintext text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN crypt(plaintext, hash) = hash;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_password(text, text) TO authenticated, anon;
