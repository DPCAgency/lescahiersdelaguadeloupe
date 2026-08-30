import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { MonProfilClient } from '@/components/admin/mon-profil-client';

export const dynamic = 'force-dynamic';

export default async function MonProfilPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('sb-access-token')?.value;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let profile: Record<string, unknown> | null = null;
  let author: Record<string, unknown> | null = null;

  if (token && supabaseUrl && anonKey) {
    const client = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData } = await client.auth.getUser(token);
    if (userData?.user?.id) {
      const { data: prof } = await client
        .from('profiles')
        .select('id, first_name, last_name, display_name, avatar_url, role, author_id')
        .eq('id', userData.user.id)
        .maybeSingle();
      profile = prof as Record<string, unknown> | null;

      if (prof?.author_id) {
        const { data: auth } = await client
          .from('authors')
          .select('id, name, slug, bio, job_title, photo_path, email_public, is_active')
          .eq('id', prof.author_id)
          .maybeSingle();
        author = auth as Record<string, unknown> | null;
      }
    }
  }

  return <MonProfilClient profile={profile} author={author} />;
}
