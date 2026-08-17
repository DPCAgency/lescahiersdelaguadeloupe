import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const blockTypeMap: Record<string, string> = {
  heading: 'heading',
  subheading: 'heading',
  paragraph: 'paragraph',
  image: 'image',
  caption: 'paragraph',
  quote: 'quote',
  key_figure: 'key_figures',
  timeline: 'timeline',
  sidebar: 'sidebar',
  footer: 'paragraph',
  unknown: 'paragraph',
  fact: 'fact',
  testimony: 'testimony',
  analysis: 'analysis',
  open_question: 'open_question',
  hypothesis: 'hypothesis',
};

interface GroupRequest {
  jobId: string;
  issueId: string;
  groups: {
    title: string;
    format: string;
    categorySlug: string;
    heroImagePath?: string;
    pageStart: number;
    pageEnd: number;
    blockIds: string[];
  }[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as GroupRequest;
    const { jobId, issueId, groups } = body;

    if (!jobId || !groups || groups.length === 0) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const created: { articleId: string; title: string }[] = [];

    for (const group of groups) {
      const slug = group.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80) || `article-${Date.now()}`;

      const excerpt = group.blockIds.length > 0
        ? (await supabaseAdmin
            .from('extracted_blocks')
            .select('edited_text, source_text')
            .eq('id', group.blockIds[0])
            .maybeSingle()
          ).data?.edited_text ?? (await supabaseAdmin
            .from('extracted_blocks')
            .select('source_text')
            .eq('id', group.blockIds[0])
            .maybeSingle()
          ).data?.source_text ?? ''
        : '';

      const { data: category } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('slug', group.categorySlug)
        .maybeSingle();

      const { data: article, error: artError } = await supabaseAdmin
        .from('articles')
        .insert({
          title: group.title,
          slug,
          excerpt: excerpt.slice(0, 300) || null,
          format: group.format,
          category_id: category?.id ?? null,
          status: 'draft',
          hero_image_path: group.heroImagePath ?? null,
        })
        .select('id')
        .single();

      if (artError) throw artError;

      if (group.blockIds.length > 0) {
        const { data: blocks } = await supabaseAdmin
          .from('extracted_blocks')
          .select('*')
          .in('id', group.blockIds)
          .order('page_number', { ascending: true });

        const blockInserts = (blocks ?? []).map((b, i) => ({
          article_id: article.id,
          type: blockTypeMap[b.type] ?? 'paragraph',
          position: i,
          content_json: {
            text: b.edited_text ?? b.source_text ?? '',
            source_block_id: b.id,
            source_page: b.page_number,
            confidence: b.confidence,
          },
        }));

        if (blockInserts.length > 0) {
          await supabaseAdmin.from('article_blocks').insert(blockInserts);
        }
      }

      await supabaseAdmin.from('article_issue_sources').insert({
        article_id: article.id,
        issue_id: issueId,
        page_start: group.pageStart,
        page_end: group.pageEnd,
        source_notes: `Créé depuis l'import ${jobId}`,
      });

      created.push({ articleId: article.id, title: group.title });
    }

    await supabaseAdmin.from('import_jobs').update({
      status: 'validated',
      completed_at: new Date().toISOString(),
    }).eq('id', jobId);

    return NextResponse.json({ success: true, created });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
