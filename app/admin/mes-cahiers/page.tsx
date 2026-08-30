import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { MesCahiersClient } from '@/components/admin/mes-cahiers-client';

export const dynamic = 'force-dynamic';

export default async function MesCahiersPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('sb-access-token')?.value;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let issues: Record<string, unknown>[] = [];

  if (token && supabaseUrl && anonKey) {
    const client = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData } = await client.auth.getUser(token);
    if (userData?.user?.id) {
      const { data } = await client
        .from('issues')
        .select(`
          id, issue_number, title, slug, status, updated_at,
          issue_collaborators!inner(role)
        `)
        .eq('issue_collaborators.profile_id', userData.user.id)
        .order('updated_at', { ascending: false });
      issues = (data as Record<string, unknown>[]) ?? [];
    }
  }

  return <MesCahiersClient issues={issues} />;
}
