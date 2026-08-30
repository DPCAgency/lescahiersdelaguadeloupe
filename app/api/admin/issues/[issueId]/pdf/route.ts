import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { getRequiredServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { issueId: string } }) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });

  const formData = await req.formData();
  const action = formData.get('action') as string | null;

  // Delete action
  if (action === 'delete') {
    try {
      const client = getRequiredServiceRoleClient();
      const { data: issue } = await client
        .from('issues')
        .select('pdf_file_path')
        .eq('id', params.issueId)
        .maybeSingle();

      if (issue?.pdf_file_path) {
        await client.storage.from('issues-private').remove([issue.pdf_file_path]);
        await client.from('issues').update({ pdf_file_path: null }).eq('id', params.issueId);
      }
      return NextResponse.json({ success: true, pdf_file_path: null });
    } catch (err) {
      console.error('[PDF DELETE]', { issueId: params.issueId, error: err });
      return NextResponse.json({ success: false, error: 'Configuration Storage serveur manquante' }, { status: 500 });
    }
  }

  // Old multipart upload flow — deprecated, return 410
  return NextResponse.json(
    { success: false, error: 'Use signed upload flow: POST /api/admin/issues/[issueId]/pdf/upload-url' },
    { status: 410 },
  );
}

export async function GET(req: NextRequest, { params }: { params: { issueId: string } }) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });

  try {
    const client = getRequiredServiceRoleClient();
    const { data: issue } = await client
      .from('issues')
      .select('pdf_file_path')
      .eq('id', params.issueId)
      .maybeSingle();

    if (!issue?.pdf_file_path) {
      return NextResponse.json({ has_pdf: false });
    }

    const { data: fileData } = await client.storage
      .from('issues-private')
      .list(`issues/${params.issueId}`, { limit: 100 });

    const fileName = issue.pdf_file_path.split('/').pop() ?? '';
    const fileEntry = fileData?.find((f) => f.name === fileName);
    const size = fileEntry?.metadata?.size ?? null;

    return NextResponse.json({
      has_pdf: true,
      path: issue.pdf_file_path,
      filename: fileName,
      size,
    });
  } catch (err) {
    console.error('[PDF GET]', { issueId: params.issueId, error: err });
    return NextResponse.json({ success: false, error: 'Configuration Storage serveur manquante' }, { status: 500 });
  }
}
