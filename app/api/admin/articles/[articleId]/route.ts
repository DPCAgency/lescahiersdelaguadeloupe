import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getEditorialUser, getPermissions } from '@/lib/permissions/editorial';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function editorialClient(token: string) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(req: NextRequest, { params }: { params: { articleId: string } }) {
  const user = await getEditorialUser(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const token = req.cookies.get('sb-access-token')!.value;
  const client = editorialClient(token);

  const { data: article, error: aErr } = await client
    .from('articles')
    .select('*')
    .eq('id', params.articleId)
    .maybeSingle();

  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });
  if (!article) return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });

  const { data: blocks } = await client
    .from('article_blocks')
    .select('*')
    .eq('article_id', params.articleId)
    .order('position', { ascending: true });

  const { data: territories } = await client
    .from('article_territories')
    .select('territory_id')
    .eq('article_id', params.articleId);

  const { data: issueSource } = await client
    .from('article_issue_sources')
    .select('issue_id, page_start, page_end, source_notes')
    .eq('article_id', params.articleId)
    .maybeSingle();

  const { data: feedback } = await client
    .from('editorial_feedback')
    .select('id, message, created_by, created_at, resolved_at')
    .eq('article_id', params.articleId)
    .order('created_at', { ascending: false });

  return NextResponse.json({
    ...article,
    blocks: blocks ?? [],
    territory_ids: (territories ?? []).map((t) => t.territory_id),
    issue_source: issueSource ?? null,
    feedback: feedback ?? [],
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { articleId: string } }) {
  const user = await getEditorialUser(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const perms = getPermissions(user.role);
  const token = req.cookies.get('sb-access-token')!.value;
  const client = editorialClient(token);

  // Fetch article to check ownership
  const { data: existing } = await client
    .from('articles')
    .select('created_by, status')
    .eq('id', params.articleId)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });

  // Ownership check: authors can only edit their own
  if (!perms.canEditAllArticles && existing.created_by !== user.id) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const body = await req.json() as Record<string, unknown>;

  // Authors cannot set status to published/scheduled/ready/archived
  const restrictedStatus = ['published', 'scheduled', 'ready', 'archived'];
  if (!perms.canPublish && body.status && restrictedStatus.includes(body.status as string)) {
    return NextResponse.json({ error: 'Accès refusé: vous ne pouvez pas publier cet article' }, { status: 403 });
  }

  // Authors cannot change created_by
  if (!perms.canEditAllArticles && body.created_by && body.created_by !== user.id) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  // Authors cannot change featured
  if (!perms.canEditAllArticles && 'featured' in body) {
    delete body.featured;
  }

  const allowed = [
    'title', 'subtitle', 'excerpt', 'format', 'category_id', 'author_id',
    'hero_image_path', 'hero_caption', 'hero_credit', 'status', 'featured',
    'published_at', 'scheduled_at', 'seo_title', 'seo_description', 'social_image_path',
    'reading_time_minutes',
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if (update.status === 'published' && !update.published_at) {
    update.published_at = new Date().toISOString();
  }

  const { data, error } = await client
    .from('articles')
    .update(update)
    .eq('id', params.articleId)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Replace blocks if provided
  if (Array.isArray(body.blocks)) {
    await client.from('article_blocks').delete().eq('article_id', params.articleId);
    if (body.blocks.length > 0) {
      const blockInserts = (body.blocks as Array<Record<string, unknown>>).map((b) => ({
        article_id: params.articleId,
        type: b.type,
        position: b.position,
        content_json: b.content_json ?? {},
        source_block_id: b.source_block_id ?? null,
      }));
      await client.from('article_blocks').insert(blockInserts);
    }
  }

  if (Array.isArray(body.territory_ids)) {
    await client.from('article_territories').delete().eq('article_id', params.articleId);
    if (body.territory_ids.length > 0) {
      await client.from('article_territories').insert(
        (body.territory_ids as string[]).map((territory_id) => ({ article_id: params.articleId, territory_id })),
      );
    }
  }

  if (body.issue_source !== undefined) {
    await client.from('article_issue_sources').delete().eq('article_id', params.articleId);
    const src = body.issue_source as { issue_id?: string; page_start?: number; page_end?: number; source_notes?: string } | null;
    if (src && src.issue_id) {
      await client.from('article_issue_sources').insert({
        article_id: params.articleId,
        issue_id: src.issue_id,
        page_start: src.page_start ?? null,
        page_end: src.page_end ?? null,
        source_notes: src.source_notes ?? null,
      });
    }
  }

  await client.from('content_revisions').insert({
    resource_type: 'article',
    resource_id: params.articleId,
    snapshot_json: data,
    created_by: user.id,
  });

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: { articleId: string } }) {
  const user = await getEditorialUser(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const perms = getPermissions(user.role);
  const token = req.cookies.get('sb-access-token')!.value;
  const client = editorialClient(token);

  const { data: article } = await client
    .from('articles')
    .select('status, created_by')
    .eq('id', params.articleId)
    .maybeSingle();

  if (!article) return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });

  // Ownership check
  if (!perms.canEditAllArticles && article.created_by !== user.id) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  // Published → archive (soft delete)
  if (article.status === 'published') {
    if (!perms.canPublish) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    const { error } = await client
      .from('articles')
      .update({ status: 'archived' })
      .eq('id', params.articleId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, archived: true });
  }

  // Authors can only delete their own drafts
  if (!perms.canDeleteAny && article.status !== 'draft') {
    return NextResponse.json({ error: 'Vous ne pouvez supprimer que vos brouillons' }, { status: 403 });
  }

  // Hard delete with cascade cleanup
  await client.from('article_blocks').delete().eq('article_id', params.articleId);
  await client.from('article_territories').delete().eq('article_id', params.articleId);
  await client.from('article_issue_sources').delete().eq('article_id', params.articleId);
  await client.from('editorial_feedback').delete().eq('article_id', params.articleId);
  await client.from('content_revisions')
    .delete()
    .eq('resource_type', 'article')
    .eq('resource_id', params.articleId);

  const { error: deleteError } = await client
    .from('articles')
    .delete()
    .eq('id', params.articleId);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  return NextResponse.json({ success: true, deleted: true });
}
