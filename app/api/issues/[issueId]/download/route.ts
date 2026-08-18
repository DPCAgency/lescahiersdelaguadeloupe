import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRequiredServiceRoleClient } from '@/lib/supabase/server';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/supabase/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function anonClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getStorageClient() {
  try {
    return getRequiredServiceRoleClient();
  } catch {
    return anonClient();
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { issueId: string } },
) {
  const issueId = params.issueId;
  if (!issueId) return NextResponse.json({ error: 'ID du Cahier requis' }, { status: 400 });

  try {
    const admin = getStorageClient();

    const { data: issue } = await admin
      .from('issues')
      .select('pdf_file_path, title, issue_number, status')
      .eq('id', issueId)
      .maybeSingle();

    if (!issue) return NextResponse.json({ error: 'Cahier introuvable' }, { status: 404 });
    if (issue.status !== 'published') return NextResponse.json({ error: 'Cahier non disponible' }, { status: 404 });
    if (!issue.pdf_file_path) return NextResponse.json({ error: 'PDF non disponible' }, { status: 404 });

    // Check feature flags
    const { data: allFlags } = await admin
      .from('feature_flags')
      .select('key, value');

    const flagMap: Record<string, boolean> = {};
    for (const f of allFlags ?? []) {
      flagMap[f.key] = f.value;
    }

    if (flagMap.pdf_download_enabled === false) {
      return NextResponse.json({ error: 'Téléchargement non disponible' }, { status: 403 });
    }

    const paymentsEnabled = Boolean(flagMap.subscriptions_enabled) || Boolean(flagMap.page_purchase_enabled) || Boolean(flagMap.full_issue_purchase_enabled);

    if (paymentsEnabled) {
      const token = req.cookies.get('sb-access-token')?.value;
      if (!token) return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });

      const { data: userData } = await admin.auth.getUser(token);
      if (!userData?.user?.id) return NextResponse.json({ error: 'Session invalide' }, { status: 401 });

      const { data: profile } = await admin
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .maybeSingle();

      const isAdmin = profile && ['editor', 'admin', 'super_admin'].includes(profile.role);

      if (!isAdmin) {
        const { data: entitlement } = await admin
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
    const { data: signedData, error: signedError } = await admin.storage
      .from('issues-private')
      .createSignedUrl(pdfPath, 300);

    if (signedError || !signedData?.signedUrl) {
      console.error('[PDF DOWNLOAD ERROR]', { issueId, path: pdfPath, message: signedError?.message });
      return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 });
    }

    return NextResponse.redirect(signedData.signedUrl, {
      headers: {
        'Content-Disposition': `attachment; filename="Cahier-N${issue.issue_number}.pdf"`,
      },
    });
  } catch (err) {
    console.error('[PDF DOWNLOAD ERROR]', { issueId, error: err });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
