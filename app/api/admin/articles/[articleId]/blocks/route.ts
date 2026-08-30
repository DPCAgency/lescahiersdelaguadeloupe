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

export async function GET(req: NextRequest, { params }: { params: { articleId: string } }) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const token = req.cookies.get('sb-access-token')!.value;
  const client = adminClient(token);

  const { data, error } = await client
    .from('article_blocks')
    .select('*')
    .eq('article_id', params.articleId)
    .order('position', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, { params }: { params: { articleId: string } }) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await req.json() as {
    type: string;
    position?: number;
    content_json?: Record<string, unknown>;
    source_block_id?: string;
  };

  const token = req.cookies.get('sb-access-token')!.value;
  const client = adminClient(token);

  const { data: existing } = await client
    .from('article_blocks')
    .select('position')
    .eq('article_id', params.articleId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = body.position ?? (existing ? existing.position + 1 : 0);

  const { data, error } = await client
    .from('article_blocks')
    .insert({
      article_id: params.articleId,
      type: body.type,
      position,
      content_json: body.content_json ?? {},
      source_block_id: body.source_block_id ?? null,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
