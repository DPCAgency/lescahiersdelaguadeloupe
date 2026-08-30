import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/admin';

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

export async function POST(req: NextRequest, { params }: { params: { articleId: string } }) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const token = req.cookies.get('sb-access-token')!.value;
  const client = adminClient(token);

  const { data: article } = await client
    .from('articles')
    .select('*')
    .eq('id', params.articleId)
    .maybeSingle();

  if (!article) return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });

  await client.from('content_revisions').insert({
    resource_type: 'article',
    resource_id: params.articleId,
    snapshot_json: article,
    created_by: user.id,
  });

  const { data, error } = await client
    .from('articles')
    .update({ status: 'draft' })
    .eq('id', params.articleId)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
