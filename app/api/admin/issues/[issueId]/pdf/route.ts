import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

function adminClient(token: string) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(req: NextRequest, { params }: { params: { issueId: string } }) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const action = formData.get('action') as string | null;

  const token = req.cookies.get('sb-access-token')!.value;
  const client = adminClient(token);

  // Delete action
  if (action === 'delete') {
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
  }

  // Upload / replace
  if (!file) return NextResponse.json({ success: false, error: 'Aucun fichier' }, { status: 400 });

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ success: false, error: 'Format non autorisé. PDF uniquement.' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ success: false, error: 'Fichier trop volumineux (max 50 MB).' }, { status: 400 });
  }

  const timestamp = Date.now();
  const filePath = `issues/${params.issueId}/${timestamp}-issue.pdf`;

  const { error: uploadError } = await client.storage
    .from('issues-private')
    .upload(filePath, file, { contentType: 'application/pdf', upsert: false });

  if (uploadError) {
    return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
  }

  // Get old path for cleanup after successful upload
  const { data: issue } = await client
    .from('issues')
    .select('pdf_file_path')
    .eq('id', params.issueId)
    .maybeSingle();

  const oldPath = issue?.pdf_file_path ?? null;

  // Update DB with new path
  const { error: updateError } = await client
    .from('issues')
    .update({ pdf_file_path: filePath })
    .eq('id', params.issueId);

  if (updateError) {
    // Rollback: remove newly uploaded file
    await client.storage.from('issues-private').remove([filePath]);
    return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
  }

  // Delete old file only after successful update
  if (oldPath) {
    await client.storage.from('issues-private').remove([oldPath]);
  }

  return NextResponse.json({
    success: true,
    pdf_file_path: filePath,
    original_name: file.name,
    size: file.size,
  });
}

export async function GET(req: NextRequest, { params }: { params: { issueId: string } }) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });

  const token = req.cookies.get('sb-access-token')!.value;
  const client = adminClient(token);

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
    .list(`issues/${params.issueId}`, { limit: 1 });

  const fileName = issue.pdf_file_path.split('/').pop() ?? '';
  const size = fileData?.[0]?.metadata?.size ?? null;

  return NextResponse.json({
    has_pdf: true,
    path: issue.pdf_file_path,
    filename: fileName,
    size,
  });
}
