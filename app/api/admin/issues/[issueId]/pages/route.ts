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
    .from('issue_pages')
    .select('*')
    .eq('issue_id', params.issueId)
    .order('page_number', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, { params }: { params: { issueId: string } }) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await req.json() as {
    page_number?: number;
    title?: string;
    is_free?: boolean;
    individual_price?: number;
  };

  const token = req.cookies.get('sb-access-token')!.value;
  const client = adminClient(token);

  // Get current max page_number
  const { data: existing } = await client
    .from('issue_pages')
    .select('page_number')
    .eq('issue_id', params.issueId)
    .order('page_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const pageNum = body.page_number ?? (existing ? existing.page_number + 1 : 1);

  const { data, error } = await client
    .from('issue_pages')
    .insert({
      issue_id: params.issueId,
      page_number: pageNum,
      position: pageNum,
      title: body.title || null,
      is_free: body.is_free ?? false,
      individual_price: body.individual_price ?? null,
      ocr_status: 'pending',
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update issue page_count
  await client.rpc('update_issue_page_count', { issue_id: params.issueId }).then(() => {});

  return NextResponse.json(data, { status: 201 });
}
