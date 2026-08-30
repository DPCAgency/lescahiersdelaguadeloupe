import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { MyArticlesClient } from '@/components/admin/my-articles-client';

export const dynamic = 'force-dynamic';

export default async function MesArticlesPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('sb-access-token')?.value;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let articles: Record<string, unknown>[] = [];

  if (token && supabaseUrl && anonKey) {
    const client = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData } = await client.auth.getUser(token);
    if (userData?.user?.id) {
      const { data } = await client
        .from('articles')
        .select('id, title, slug, format, status, featured, published_at, updated_at, category_id, author_id, categories(slug, name), authors(slug, name)')
        .eq('created_by', userData.user.id)
        .order('updated_at', { ascending: false });
      articles = (data as Record<string, unknown>[]) ?? [];
    }
  }

  return <MyArticlesClient articles={articles} />;
}
