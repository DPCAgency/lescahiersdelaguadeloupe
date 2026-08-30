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

export async function GET(req: NextRequest, { params }: { params: { issueId: string } }) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const token = req.cookies.get('sb-access-token')!.value;
  const client = adminClient(token);

  const { data, error } = await client
    .from('page_blocks')
    .select('*')
    .eq('issue_id', params.issueId)
    .order('page_number', { ascending: true })
    .order('position', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, { params }: { params: { issueId: string } }) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await req.json() as {
    page_number: number;
    block_type: string;
    position?: number;
    content_json?: Record<string, unknown>;
  };

  const token = req.cookies.get('sb-access-token')!.value;
  const client = adminClient(token);

  // Get max position for this page
  const { data: existing } = await client
    .from('page_blocks')
    .select('position')
    .eq('issue_id', params.issueId)
    .eq('page_number', body.page_number)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = body.position ?? (existing ? existing.position + 1 : 0);

  const { data, error } = await client
    .from('page_blocks')
    .insert({
      issue_id: params.issueId,
      page_number: body.page_number,
      block_type: body.block_type,
      position,
      content_json: body.content_json ?? {},
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
