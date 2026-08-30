import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from './env';

let _adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_adminClient) return _adminClient;

  const supabaseUrl = getSupabaseUrl();
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || getSupabaseAnonKey();

  _adminClient = createClient(supabaseUrl, supabaseServiceKey);
  return _adminClient;
}

export function getRequiredServiceRoleClient(): SupabaseClient {
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl) throw new Error('SUPABASE_URL missing');
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY missing');
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabaseAdmin()[prop as keyof SupabaseClient];
  },
});
