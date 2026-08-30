import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase/server';
import { ArticlesListClient, type ArticleRow } from '@/components/admin/articles-list-client';

export const dynamic = 'force-dynamic';

export default async function AdminArticlesPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('sb-access-token')?.value;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let role = 'admin';
  let userId: string | null = null;

  if (token && supabaseUrl && anonKey) {
    const client = createClient(supabaseUrl, anonKey);
    const { data: userData } = await client.auth.getUser(token);
    if (userData?.user?.id) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: profile } = await userClient
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .maybeSingle();
      if (profile?.role) {
        role = profile.role;
        userId = userData.user.id;
      }
    }
  }

  const { data: categories } = await supabaseAdmin.from('categories').select('id, name, slug').eq('is_active', true).order('position');
  const { data: authors } = await supabaseAdmin.from('authors').select('id, name').eq('is_active', true).order('name');

  let articles;
  if (role === 'author' && userId) {
    // Authors see only their own articles
    const userClient = createClient(supabaseUrl!, anonKey!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await userClient
      .from('articles')
      .select('id, title, slug, format, status, featured, published_at, updated_at, category_id, author_id, categories(slug, name), authors(slug, name)')
      .eq('created_by', userId)
      .order('updated_at', { ascending: false });
    articles = data;
  } else {
    const { data } = await supabaseAdmin
      .from('articles')
      .select('id, title, slug, format, status, featured, published_at, updated_at, category_id, author_id, categories(slug, name), authors(slug, name)')
      .order('updated_at', { ascending: false });
    articles = data;
  }

  return (
    <ArticlesListClient
      articles={(articles ?? []) as unknown as ArticleRow[]}
      categories={categories ?? []}
      authors={authors ?? []}
    />
  );
}
