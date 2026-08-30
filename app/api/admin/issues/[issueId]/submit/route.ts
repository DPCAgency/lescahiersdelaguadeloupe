import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getIssueUser, getIssuePermissions } from '@/lib/permissions/issues';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function issueClient(token: string) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(req: NextRequest, { params }: { params: { issueId: string } }) {
  const user = await getIssueUser(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const perms = await getIssuePermissions(user, params.issueId);
  if (!perms.canSubmit) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const token = req.cookies.get('sb-access-token')!.value;
  const client = issueClient(token);

  const { data: issue } = await client
    .from('issues')
    .select('status')
    .eq('id', params.issueId)
    .maybeSingle();

  if (!issue) return NextResponse.json({ error: 'Cahier introuvable' }, { status: 404 });
  if (issue.status !== 'draft' && issue.status !== 'changes_requested') {
    return NextResponse.json({ error: 'Ce Cahier ne peut pas être soumis' }, { status: 400 });
  }

  const { error } = await client
    .from('issues')
    .update({ status: 'review', submitted_at: new Date().toISOString() })
    .eq('id', params.issueId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: updated } = await client.from('issues').select('*').eq('id', params.issueId).single();
  if (updated) {
    await client.from('content_revisions').insert({
      resource_type: 'issue', resource_id: params.issueId,
      snapshot_json: updated, created_by: user.id,
    });
  }

  return NextResponse.json({ success: true, status: 'review' });
}
