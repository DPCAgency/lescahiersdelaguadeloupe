import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { getRequiredServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { issueId: string } }) {
  try {
    const admin = getRequiredServiceRoleClient();
    const { data: issue } = await admin
      .from('issues')
      .select('pdf_file_path')
      .eq('id', params.issueId)
      .maybeSingle();

    if (!issue) return NextResponse.json({ error: 'Cahier introuvable' }, { status: 404 });
    if (!issue.pdf_file_path) return NextResponse.json({ error: 'PDF non disponible' }, { status: 404 });

    const { data, error } = await admin.storage
      .from('issues-private')
      .createSignedUrl(issue.pdf_file_path, 3600);

    if (error || !data?.signedUrl) {
      console.error('[ADMIN PDF VIEW ERROR]', { issueId: params.issueId, path: issue.pdf_file_path, message: error?.message });
      return NextResponse.json({ error: 'URL signée indisponible' }, { status: 500 });
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (err) {
    console.error('[ADMIN PDF VIEW ERROR]', { issueId: params.issueId, error: err });
    return NextResponse.json({ error: 'Configuration Storage serveur manquante' }, { status: 500 });
  }
}
