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
    .from('issues')
    .select('*')
    .eq('id', params.issueId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Cahier introuvable' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: { issueId: string } }) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  const token = req.cookies.get('sb-access-token')!.value;
  const client = adminClient(token);

  const allowed = [
    'title', 'subtitle', 'description', 'publication_date', 'cover_image_path',
    'page_count', 'status', 'price_per_page', 'full_download_price',
    'pdf_file_path', 'theme', 'editorial_director', 'free_pages_count',
    'download_enabled', 'scheduled_at',
  ];

  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  // When publishing, set published_at equivalent via publication_date if not set
  if (update.status === 'published' && !update.publication_date) {
    update.publication_date = new Date().toISOString().split('T')[0];
  }

  // Concurrency check: if updated_at provided, verify it matches
  if (body.updated_at) {
    const { data: current } = await client
      .from('issues')
      .select('updated_at')
      .eq('id', params.issueId)
      .maybeSingle();
    if (current && new Date(current.updated_at) > new Date(body.updated_at as string)) {
      return NextResponse.json({ error: 'Une version plus récente existe. Rechargez la page.' }, { status: 409 });
    }
  }

  const { data, error } = await client
    .from('issues')
    .update(update)
    .eq('id', params.issueId)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create revision snapshot
  await client.from('content_revisions').insert({
    resource_type: 'issue',
    resource_id: params.issueId,
    snapshot_json: data,
    created_by: user.id,
  });

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: { issueId: string } }) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const token = req.cookies.get('sb-access-token')!.value;
  const client = adminClient(token);

  // Check if published — don't hard delete, archive instead
  const { data: issue } = await client
    .from('issues')
    .select('status')
    .eq('id', params.issueId)
    .maybeSingle();

  if (!issue) return NextResponse.json({ error: 'Cahier introuvable' }, { status: 404 });

  if (issue.status === 'published') {
    // Soft delete: archive
    const { error } = await client
      .from('issues')
      .update({ status: 'archived' })
      .eq('id', params.issueId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, archived: true });
  }

  // Draft/other: hard delete
  const { error } = await client
    .from('issues')
    .delete()
    .eq('id', params.issueId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
