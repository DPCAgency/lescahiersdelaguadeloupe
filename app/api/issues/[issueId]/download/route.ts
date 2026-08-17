import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { supabase } from '@/lib/supabase/client';
import { getSupabaseUrl, getSupabaseAnonKey, getStorageAdminUrl } from '@/lib/supabase/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { issueId: string } },
) {
  const issueId = params.issueId;

  if (!issueId) {
    return NextResponse.json({ error: 'ID du Cahier requis' }, { status: 400 });
  }

  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });
  }

  const userId = session.user.id;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  const isAdmin = profile && ['editor', 'admin', 'super_admin'].includes(profile.role);

  // Fetch all feature flags
  const { data: allFlags } = await supabaseAdmin
    .from('feature_flags')
    .select('key, value');

  const flagMap: Record<string, boolean> = {};
  for (const f of allFlags ?? []) {
    flagMap[f.key] = f.value;
  }

  const paymentsEnabled = Boolean(flagMap.subscriptions_enabled) || Boolean(flagMap.page_purchase_enabled) || Boolean(flagMap.full_issue_purchase_enabled);

  // If PDF download is disabled by flag, block
  if (!flagMap.pdf_download_enabled) {
    return NextResponse.json({ error: 'Téléchargement non disponible' }, { status: 403 });
  }

  // When payments are disabled (V1 free mode), allow download of published issues
  if (!paymentsEnabled) {
    // Still verify the issue is published
    const { data: issueCheck } = await supabaseAdmin
      .from('issues')
      .select('status')
      .eq('id', issueId)
      .maybeSingle();

    if (!issueCheck || issueCheck.status !== 'published') {
      return NextResponse.json({ error: 'Cahier non disponible' }, { status: 404 });
    }
    // Allow download — fall through to file retrieval below
  } else if (!isAdmin) {
    // Payments enabled: check entitlement
    const { data: entitlement } = await supabaseAdmin
      .from('entitlements')
      .select('id')
      .eq('user_id', userId)
      .eq('resource_id', issueId)
      .eq('resource_type', 'issue_full')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .maybeSingle();

    if (!entitlement) {
      return NextResponse.json({ error: 'Achat du Cahier requis' }, { status: 403 });
    }
  }

  const { data: issue } = await supabaseAdmin
    .from('issues')
    .select('pdf_file_path, title, issue_number')
    .eq('id', issueId)
    .maybeSingle();

  if (!issue?.pdf_file_path) {
    return NextResponse.json({ error: 'PDF non disponible' }, { status: 404 });
  }

  const pdfPath = issue.pdf_file_path;

  if (pdfPath.startsWith('/assets/pdf/')) {
    const downloadUrl = `${getSupabaseUrl()}/storage/v1/object/public/${pdfPath.replace(/^\//, '')}`;
    return NextResponse.redirect(downloadUrl, {
      headers: {
        'Content-Disposition': `attachment; filename="Cahier-N${issue.issue_number}.pdf"`,
      },
    });
  }

  const downloadResp = await fetch(
    getStorageAdminUrl('download'),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getSupabaseAnonKey()}`,
      },
      body: JSON.stringify({ path: pdfPath }),
    },
  );

  if (!downloadResp.ok) {
    return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 });
  }

  const arrayBuffer = await downloadResp.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Cahier-N${issue.issue_number}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
