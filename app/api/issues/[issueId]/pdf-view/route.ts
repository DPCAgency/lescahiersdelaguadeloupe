import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { issueId: string } }) {
  const { data: issue } = await supabaseAdmin
    .from('issues')
    .select('pdf_file_path, status')
    .eq('id', params.issueId)
    .maybeSingle();

  if (!issue) return NextResponse.json({ error: 'Cahier introuvable' }, { status: 404 });
  if (issue.status !== 'published') return NextResponse.json({ error: 'Cahier non public' }, { status: 403 });
  if (!issue.pdf_file_path) return NextResponse.json({ error: 'PDF non disponible' }, { status: 404 });

  const { data, error } = await supabaseAdmin.storage
    .from('issues-private')
    .createSignedUrl(issue.pdf_file_path, 3600);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'URL signée indisponible' }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
