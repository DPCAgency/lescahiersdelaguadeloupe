import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/admin';
import { getRequiredServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function userClient(token: string) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getStorageClient(req: NextRequest) {
  try {
    return getRequiredServiceRoleClient();
  } catch {
    const token = req.cookies.get('sb-access-token')!.value;
    return userClient(token);
  }
}

export async function POST(req: NextRequest, { params }: { params: { issueId: string } }) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });

  let body: { path?: string; originalName?: string; size?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body JSON invalide' }, { status: 400 });
  }

  const { path, originalName, size } = body;

  if (!path || !path.startsWith(`issues/${params.issueId}/`)) {
    return NextResponse.json({ success: false, error: 'Chemin de fichier invalide' }, { status: 400 });
  }

  try {
    const client = getStorageClient(req);

    // Verify the object exists in storage
    const { data: fileData, error: listError } = await client.storage
      .from('issues-private')
      .list(`issues/${params.issueId}`, { limit: 100 });

    if (listError) {
      console.error('[PDF COMPLETE] list error', { issueId: params.issueId, message: listError.message });
      return NextResponse.json({ success: false, error: 'Vérification du fichier impossible' }, { status: 500 });
    }

    const fileName = path.split('/').pop() ?? '';
    const exists = fileData?.some((f) => f.name === fileName);
    if (!exists) {
      return NextResponse.json({ success: false, error: 'Le fichier n\'a pas été trouvé dans le stockage' }, { status: 404 });
    }

    // Get old path for cleanup
    const { data: issue } = await client
      .from('issues')
      .select('pdf_file_path')
      .eq('id', params.issueId)
      .maybeSingle();

    const oldPath = issue?.pdf_file_path ?? null;

    // Update DB with new path
    const { error: updateError } = await client
      .from('issues')
      .update({ pdf_file_path: path })
      .eq('id', params.issueId);

    if (updateError) {
      console.error('[PDF COMPLETE] update error', { issueId: params.issueId, message: updateError.message });
      return NextResponse.json({ success: false, error: 'Échec de la mise à jour' }, { status: 500 });
    }

    // Delete old file only after successful DB update
    if (oldPath && oldPath !== path) {
      await client.storage.from('issues-private').remove([oldPath]);
    }

    return NextResponse.json({
      success: true,
      pdf_file_path: path,
      original_name: originalName,
      size,
    });
  } catch (err) {
    console.error('[PDF COMPLETE]', { issueId: params.issueId, error: err });
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
