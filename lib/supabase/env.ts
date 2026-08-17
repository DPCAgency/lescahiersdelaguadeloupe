export function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('Configuration Supabase manquante sur le serveur: NEXT_PUBLIC_SUPABASE_URL non définie.');
  }
  return url;
}

export function getSupabaseAnonKey(): string {
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('Configuration Supabase manquante sur le serveur: NEXT_PUBLIC_SUPABASE_ANON_KEY non définie.');
  }
  return key;
}

export function getStorageAdminUrl(action: string): string {
  const url = new URL('/functions/v1/storage-admin', getSupabaseUrl());
  url.searchParams.set('action', action);
  return url.toString();
}
