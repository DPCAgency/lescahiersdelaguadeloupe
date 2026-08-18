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

export async function GET(_req: NextRequest, { params }: { params: { issueId: string } }) {
  try {
    const admin = getStorageClient();
    const { data: issue } = await admin
      .from('issues')
      .select('pdf_file_path, status')
      .eq('id', params.issueId)
      .maybeSingle();

    if (!issue) return NextResponse.json({ error: 'Cahier introuvable' }, { status: 404 });
    if (issue.status !== 'published') return NextResponse.json({ error: 'Cahier non public' }, { status: 403 });
    if (!issue.pdf_file_path) return NextResponse.json({ error: 'PDF non disponible' }, { status: 404 });

    const { data, error } = await admin.storage
      .from('issues-private')
      .createSignedUrl(issue.pdf_file_path, 3600);

    if (error || !data?.signedUrl) {
      console.error('[PDF VIEW ERROR]', { issueId: params.issueId, path: issue.pdf_file_path, message: error?.message });
      return NextResponse.json({ error: 'URL signée indisponible' }, { status: 500 });
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (err) {
    console.error('[PDF VIEW ERROR]', { issueId: params.issueId, error: err });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
