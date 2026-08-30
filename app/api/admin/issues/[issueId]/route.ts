import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/admin';
import { getRequiredServiceRoleClient } from '@/lib/supabase/server';

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

  try {
    const admin = getRequiredServiceRoleClient();

    // Fetch the issue to check status and get paths
    const { data: issue } = await admin
      .from('issues')
      .select('status, pdf_file_path, cover_image_path')
      .eq('id', params.issueId)
      .maybeSingle();

    if (!issue) return NextResponse.json({ error: 'Cahier introuvable' }, { status: 404 });

    // Published → archive (soft delete)
    if (issue.status === 'published') {
      const { error } = await admin
        .from('issues')
        .update({ status: 'archived' })
        .eq('id', params.issueId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, archived: true });
    }

    // Draft/ready/scheduled/archived → hard delete with cascade cleanup

    // 1. Delete dependent rows
    await admin.from('page_blocks').delete().eq('issue_id', params.issueId);
    await admin.from('issue_pages').delete().eq('issue_id', params.issueId);
    await admin.from('issue_assets').delete().eq('issue_id', params.issueId);
    await admin.from('article_issue_sources').delete().eq('issue_id', params.issueId);
    await admin.from('downloads').delete().eq('issue_id', params.issueId);
    await admin.from('reading_progress').delete().eq('issue_id', params.issueId);
    await admin.from('content_revisions')
      .delete()
      .eq('resource_type', 'issue')
      .eq('resource_id', params.issueId);

    // 2. Delete Storage files
    const filesToRemove: string[] = [];
    if (issue.pdf_file_path) filesToRemove.push(issue.pdf_file_path);
    if (filesToRemove.length > 0) {
      await admin.storage.from('issues-private').remove(filesToRemove);
    }

    // 3. Delete the issue row
    const { error: deleteError } = await admin
      .from('issues')
      .delete()
      .eq('id', params.issueId);

    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
    return NextResponse.json({ success: true, deleted: true });
  } catch (err) {
    console.error('[ISSUE DELETE]', { issueId: params.issueId, error: err });
    return NextResponse.json({ error: 'Configuration Storage serveur manquante' }, { status: 500 });
  }
}
