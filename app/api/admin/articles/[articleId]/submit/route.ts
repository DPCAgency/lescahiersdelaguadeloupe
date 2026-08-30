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

export async function POST(req: NextRequest, { params }: { params: { articleId: string } }) {
  const user = await getEditorialUser(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const perms = getPermissions(user.role);
  if (!perms.canSubmit) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const token = req.cookies.get('sb-access-token')!.value;
  const client = editorialClient(token);

  const { data: article } = await client
    .from('articles')
    .select('created_by, status, title, category_id, author_id')
    .eq('id', params.articleId)
    .maybeSingle();

  if (!article) return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });

  // Authors can only submit their own
  if (!perms.canEditAllArticles && article.created_by !== user.id) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  // Can only submit from draft or changes_requested
  if (article.status !== 'draft' && article.status !== 'changes_requested') {
    return NextResponse.json({ error: 'Cet article ne peut pas être soumis' }, { status: 400 });
  }

  // Checklist validation
  const missing: string[] = [];
  if (!article.title || article.title.trim() === '') missing.push('Titre');
  if (!article.category_id) missing.push('Rubrique');
  if (!article.author_id) missing.push('Auteur');

  // Check content
  const { count: blockCount } = await client
    .from('article_blocks')
    .select('*', { count: 'exact', head: true })
    .eq('article_id', params.articleId);

  if (!blockCount || blockCount === 0) missing.push('Contenu');

  if (missing.length > 0) {
    return NextResponse.json({ error: 'Impossible de soumettre', missing }, { status: 400 });
  }

  const { error } = await client
    .from('articles')
    .update({
      status: 'review',
      submitted_at: new Date().toISOString(),
    })
    .eq('id', params.articleId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create revision
  const { data: updated } = await client
    .from('articles')
    .select('*')
    .eq('id', params.articleId)
    .single();

  if (updated) {
    await client.from('content_revisions').insert({
      resource_type: 'article',
      resource_id: params.articleId,
      snapshot_json: updated,
      created_by: user.id,
    });
  }

  return NextResponse.json({ success: true, status: 'review' });
}
