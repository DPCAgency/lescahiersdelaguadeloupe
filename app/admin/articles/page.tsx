import { supabaseAdmin } from '@/lib/supabase/server';
import { ArticlesListClient, type ArticleRow } from '@/components/admin/articles-list-client';

export const dynamic = 'force-dynamic';

export default async function AdminArticlesPage() {
  const { data: articles } = await supabaseAdmin
    .from('articles')
    .select('id, title, slug, format, status, featured, published_at, updated_at, category_id, author_id, categories(slug, name), authors(slug, name)')
    .order('updated_at', { ascending: false });

  const { data: categories } = await supabaseAdmin.from('categories').select('id, name, slug').eq('is_active', true).order('position');
  const { data: authors } = await supabaseAdmin.from('authors').select('id, name').eq('is_active', true).order('name');

  return (
    <ArticlesListClient
      articles={(articles ?? []) as unknown as ArticleRow[]}
      categories={categories ?? []}
      authors={authors ?? []}
    />
  );
}
