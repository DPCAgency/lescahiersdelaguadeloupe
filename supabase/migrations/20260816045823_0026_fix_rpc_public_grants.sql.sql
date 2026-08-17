/*
# Fix RPC function grants - revoke PUBLIC access

## Problem
The previous migration revoked EXECUTE from `anon` but the functions
also had a PUBLIC grant (`=X/postgres` in proacl) which still allows
anon to call them.

## Changes
1. REVOKE EXECUTE FROM PUBLIC on get_admin_user_id, signin_fallback, verify_password
2. GRANT EXECUTE TO authenticated only (server-side code uses service role key
   which bypasses these grants)

## TODO AUTH-001
Migrer complètement le compte super_admin vers le flux GoTrue officiel
et supprimer signin_fallback / get_admin_user_id lorsqu'ils ne sont
plus nécessaires.
*/

REVOKE EXECUTE ON FUNCTION public.get_admin_user_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_user_id() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.signin_fallback(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.signin_fallback(text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.verify_password(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_password(text, text) TO authenticated;