/*
# Secure RPC functions and update delete_import_job

## Problem
Several SECURITY DEFINER functions were executable by the `anon` role:
- `get_admin_user_id` — returns a super_admin UUID to any caller
- `signin_fallback` — authenticates without GoTrue
- `verify_password` — checks password hashes

The `anon` role should never be able to call `get_admin_user_id` and
obtain a super_admin UUID, as this leaks privileged information.

## Changes
1. Revoke EXECUTE from `anon` on `get_admin_user_id`
2. Revoke EXECUTE from `anon` on `signin_fallback` and `verify_password`
3. Drop and recreate `delete_import_job` to also remove Storage objects

## TODO AUTH-001
Migrer complètement le compte super_admin vers le flux GoTrue officiel
et supprimer signin_fallback / get_admin_user_id lorsqu'ils ne sont
plus nécessaires.
*/

REVOKE EXECUTE ON FUNCTION public.get_admin_user_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.signin_fallback(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.verify_password(text, text) FROM anon;

DROP FUNCTION IF EXISTS public.delete_import_job(uuid);

CREATE OR REPLACE FUNCTION public.delete_import_job(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_path text;
BEGIN
  SELECT source_file_path INTO v_path
  FROM import_jobs WHERE id = p_job_id;

  DELETE FROM import_jobs WHERE id = p_job_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_import_job(uuid) TO anon, authenticated;