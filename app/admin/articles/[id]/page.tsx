import { supabaseAdmin } from '@/lib/supabase/server';
import ArticleEditorClient from '@/components/admin/article-editor-client';

export const dynamic = 'force-dynamic';

export default async function ArticleEditorPage({ params }: { params: { id: string } }) {
  const { data: categories } = await supabaseAdmin
    .from('categories')
    .select('id, name')
    .eq('is_active', true)
    .order('position');

  const { data: authors } = await supabaseAdmin
    .from('authors')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  const { data: territories } = await supabaseAdmin
    .from('territories')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  const { data: issues } = await supabaseAdmin
    .from('issues')
    .select('id, issue_number, title')
    .order('issue_number', { ascending: false });

  return (
    <ArticleEditorClient
      articleId={params.id}
      categories={categories ?? []}
      authors={authors ?? []}
      territories={territories ?? []}
      issues={issues ?? []}
    />
  );
}
