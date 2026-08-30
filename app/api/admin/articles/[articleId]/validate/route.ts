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
  if (!perms.canReview) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const token = req.cookies.get('sb-access-token')!.value;
  const client = editorialClient(token);

  const { data: article } = await client
    .from('articles')
    .select('status')
    .eq('id', params.articleId)
    .maybeSingle();

  if (!article) return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });

  if (article.status !== 'review') {
    return NextResponse.json({ error: 'Cet article n\'est pas en attente de validation' }, { status: 400 });
  }

  const { error } = await client
    .from('articles')
    .update({
      status: 'ready',
      validated_by: user.id,
      validated_at: new Date().toISOString(),
    })
    .eq('id', params.articleId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Resolve any open feedback
  await client
    .from('editorial_feedback')
    .update({ resolved_at: new Date().toISOString() })
    .eq('article_id', params.articleId)
    .is('resolved_at', null);

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

  return NextResponse.json({ success: true, status: 'ready' });
}
