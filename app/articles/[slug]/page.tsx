import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { ArticleRenderer, type ArticleRenderData } from '@/components/editorial/article-renderer';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Params { slug: string }

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { data: article } = await supabaseAdmin
    .from('articles')
    .select('title, seo_title, seo_description, excerpt, social_image_path, hero_image_path, slug')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!article) return { title: 'Article introuvable' };

  const title = article.seo_title || article.title;
  const description = article.seo_description || article.excerpt || '';
  const image = article.social_image_path || article.hero_image_path || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [image] : undefined,
      type: 'article',
    },
    alternates: { canonical: `/articles/${article.slug}` },
  };
}

export default async function PublicArticlePage({ params }: { params: Params }) {
  const { data: article } = await supabaseAdmin
    .from('articles')
    .select(`
      id, title, subtitle, excerpt, hero_image_path, hero_caption, hero_credit,
      published_at, reading_time_minutes,
      author:authors(name),
      category:categories(name)
    `)
    .eq('slug', params.slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!article) notFound();

  const { data: blocks } = await supabaseAdmin
    .from('article_blocks')
    .select('id, type, position, content_json')
    .eq('article_id', article.id)
    .order('position', { ascending: true });

  const renderData: ArticleRenderData = {
    title: article.title,
    subtitle: article.subtitle,
    excerpt: article.excerpt,
    hero_image_path: article.hero_image_path,
    hero_caption: article.hero_caption,
    hero_credit: article.hero_credit,
    author_name: (article.author as { name?: string } | null)?.name ?? null,
    category_name: (article.category as { name?: string } | null)?.name ?? null,
    published_at: article.published_at,
    reading_time_minutes: article.reading_time_minutes,
    blocks: (blocks ?? []).map((b) => ({
      id: b.id as string,
      type: b.type as string,
      position: b.position as number,
      content_json: b.content_json as Record<string, unknown>,
    })),
  };

  return (
    <div className="py-12">
      <ArticleRenderer article={renderData} />
    </div>
  );
}
