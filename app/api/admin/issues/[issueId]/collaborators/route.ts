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

export async function GET(req: NextRequest, { params }: { params: { issueId: string } }) {
  const user = await getIssueUser(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const perms = await getIssuePermissions(user, params.issueId);
  if (!perms.canView) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const token = req.cookies.get('sb-access-token')!.value;
  const client = issueClient(token);

  const { data, error } = await client
    .from('issue_collaborators')
    .select('id, profile_id, role, created_at, profiles!inner(display_name, role, email)')
    .eq('issue_id', params.issueId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, { params }: { params: { issueId: string } }) {
  const user = await getIssueUser(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const perms = await getIssuePermissions(user, params.issueId);
  if (!perms.canManageCollaborators) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const body = await req.json() as { profile_id?: string; role?: string };
  if (!body.profile_id) return NextResponse.json({ error: 'profile_id requis' }, { status: 400 });
  if (!['contributor', 'editor'].includes(body.role ?? '')) {
    return NextResponse.json({ error: 'Rôle invalide (contributor ou editor)' }, { status: 400 });
  }

  const token = req.cookies.get('sb-access-token')!.value;
  const client = issueClient(token);

  const { data, error } = await client
    .from('issue_collaborators')
    .insert({
      issue_id: params.issueId,
      profile_id: body.profile_id,
      role: body.role,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Ce membre est déjà collaborateur' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: { issueId: string } }) {
  const user = await getIssueUser(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const perms = await getIssuePermissions(user, params.issueId);
  if (!perms.canManageCollaborators) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const body = await req.json() as { collaborator_id?: string; role?: string };
  if (!body.collaborator_id) return NextResponse.json({ error: 'collaborator_id requis' }, { status: 400 });
  if (!['contributor', 'editor'].includes(body.role ?? '')) {
    return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 });
  }

  const token = req.cookies.get('sb-access-token')!.value;
  const client = issueClient(token);

  const { error } = await client
    .from('issue_collaborators')
    .update({ role: body.role })
    .eq('id', body.collaborator_id)
    .eq('issue_id', params.issueId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { issueId: string } }) {
  const user = await getIssueUser(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const perms = await getIssuePermissions(user, params.issueId);
  if (!perms.canManageCollaborators) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const collaboratorId = searchParams.get('id');
  if (!collaboratorId) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const token = req.cookies.get('sb-access-token')!.value;
  const client = issueClient(token);

  const { error } = await client
    .from('issue_collaborators')
    .delete()
    .eq('id', collaboratorId)
    .eq('issue_id', params.issueId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
