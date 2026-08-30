import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { getRequiredServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest, { params }: { params: { issueId: string } }) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });

  let body: { filename?: string; size?: number; contentType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body JSON invalide' }, { status: 400 });
  }

  const { filename, size, contentType } = body;

  if (!filename || !filename.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ success: false, error: 'Nom de fichier invalide (.pdf requis)' }, { status: 400 });
  }
  if (contentType && contentType !== 'application/pdf') {
    return NextResponse.json({ success: false, error: 'Format non autorisé. PDF uniquement.' }, { status: 400 });
  }
  if (!size || size > MAX_SIZE) {
    return NextResponse.json({ success: false, error: 'Fichier trop volumineux (max 50 MB).' }, { status: 400 });
  }

  try {
    const admin = getRequiredServiceRoleClient();
    const timestamp = Date.now();
    const filePath = `issues/${params.issueId}/${timestamp}-issue.pdf`;

    const { data, error } = await admin.storage
      .from('issues-private')
      .createSignedUploadUrl(filePath);

    if (error || !data) {
      console.error('[PDF UPLOAD URL]', { issueId: params.issueId, message: error?.message });
      return NextResponse.json({ success: false, error: 'Impossible de créer l\'URL d\'upload' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      path: filePath,
      token: data.token,
      signedUrl: data.signedUrl,
    });
  } catch (err) {
    console.error('[PDF UPLOAD URL]', { issueId: params.issueId, error: err });
    return NextResponse.json({ success: false, error: 'Configuration Storage serveur manquante' }, { status: 500 });
  }
}
