import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/admin';
import { ArticleRenderer, type ArticleRenderData } from '@/components/editorial/article-renderer';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function adminClient(token: string) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default async function ArticlePreviewPage({ params }: { params: { id: string } }) {
  const req = new NextRequest('http://localhost');
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  // Use service role for preview — admin can see any status
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: article } = await client
    .from('articles')
    .select(`
      id, title, subtitle, excerpt, hero_image_path, hero_caption, hero_credit,
      status, published_at, reading_time_minutes,
      author:authors(name),
      category:categories(name)
    `)
    .eq('id', params.id)
    .maybeSingle();

  if (!article) return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });

  const { data: blocks } = await client
    .from('article_blocks')
    .select('id, type, position, content_json')
    .eq('article_id', params.id)
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

  const isPublic = article.status === 'published';

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href={`/admin/articles/${params.id}`} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Retour à l'éditeur
          </Link>
          {!isPublic && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              {article.status === 'draft' ? 'BROUILLON — NON PUBLIC' :
               article.status === 'review' ? 'EN REVUE — NON PUBLIC' :
               article.status === 'ready' ? 'PRÊT — NON PUBLIC' :
               article.status === 'scheduled' ? 'PROGRAMMÉ — NON PUBLIC' :
               'NON PUBLIC'}
            </span>
          )}
        </div>
      </div>
      <div className="py-12">
        <ArticleRenderer article={renderData} />
      </div>
    </div>
  );
}
