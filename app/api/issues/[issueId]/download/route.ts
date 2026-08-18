import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSupabaseUrl, getSupabaseAnonKey, getStorageAdminUrl } from '@/lib/supabase/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { issueId: string } },
) {
  const issueId = params.issueId;
  if (!issueId) return NextResponse.json({ error: 'ID du Cahier requis' }, { status: 400 });

  // Fetch issue
  const { data: issue } = await supabaseAdmin
    .from('issues')
    .select('pdf_file_path, title, issue_number, status')
    .eq('id', issueId)
    .maybeSingle();

  if (!issue) return NextResponse.json({ error: 'Cahier introuvable' }, { status: 404 });
  if (issue.status !== 'published') return NextResponse.json({ error: 'Cahier non disponible' }, { status: 404 });
  if (!issue.pdf_file_path) return NextResponse.json({ error: 'PDF non disponible' }, { status: 404 });

  // Check feature flags
  const { data: allFlags } = await supabaseAdmin
    .from('feature_flags')
    .select('key, value');

  const flagMap: Record<string, boolean> = {};
  for (const f of allFlags ?? []) {
    flagMap[f.key] = f.value;
  }

  // If PDF download is explicitly disabled, block
  if (flagMap.pdf_download_enabled === false) {
    return NextResponse.json({ error: 'Téléchargement non disponible' }, { status: 403 });
  }

  const paymentsEnabled = Boolean(flagMap.subscriptions_enabled) || Boolean(flagMap.page_purchase_enabled) || Boolean(flagMap.full_issue_purchase_enabled);

  // When payments are disabled (V1 free mode), allow download of published issues without session
  if (paymentsEnabled) {
    // Check for session via cookie
    const token = req.cookies.get('sb-access-token')?.value;
    if (!token) return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });

    // Verify user
    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    if (!userData?.user?.id) return NextResponse.json({ error: 'Session invalide' }, { status: 401 });

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .maybeSingle();

    const isAdmin = profile && ['editor', 'admin', 'super_admin'].includes(profile.role);

    if (!isAdmin) {
      const { data: entitlement } = await supabaseAdmin
        .from('entitlements')
        .select('id')
        .eq('user_id', userData.user.id)
        .eq('resource_id', issueId)
        .eq('resource_type', 'issue_full')
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .maybeSingle();

      if (!entitlement) {
        return NextResponse.json({ error: 'Achat du Cahier requis' }, { status: 403 });
      }
    }
  }

  const pdfPath = issue.pdf_file_path;

  // If it's a public-assets path, redirect to public URL
  if (pdfPath.startsWith('/assets/pdf/')) {
    const downloadUrl = `${getSupabaseUrl()}/storage/v1/object/public/${pdfPath.replace(/^\//, '')}`;
    return NextResponse.redirect(downloadUrl, {
      headers: {
        'Content-Disposition': `attachment; filename="Cahier-N${issue.issue_number}.pdf"`,
      },
    });
  }

  // Private bucket: generate signed URL and redirect
  const { data: signedData, error: signedError } = await supabaseAdmin.storage
    .from('issues-private')
    .createSignedUrl(pdfPath, 300);

  if (signedError || !signedData?.signedUrl) {
    return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 });
  }

  return NextResponse.redirect(signedData.signedUrl, {
    headers: {
      'Content-Disposition': `attachment; filename="Cahier-N${issue.issue_number}.pdf"`,
    },
  });
}
