import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function adminClient(token: string) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 });

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: 'Format non autorisé. Formats acceptés: JPEG, PNG, WEBP.' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 10 MB).' }, { status: 400 });
  }

  const token = req.cookies.get('sb-access-token')!.value;
  const client = adminClient(token);

  // Generate non-predictable filename
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
  const filename = `${crypto.randomUUID()}.${safeExt}`;
  const filePath = `media/${filename}`;

  const { data: uploadData, error: uploadError } = await client.storage
    .from('public-assets')
    .upload(filePath, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Get public URL
  const { data: urlData } = client.storage.from('public-assets').getPublicUrl(filePath);

  // Record in issue_assets
  const { data: asset, error: assetError } = await client
    .from('issue_assets')
    .insert({
      issue_id: formData.get('issue_id') as string || crypto.randomUUID(),
      asset_type: 'image',
      file_path: filePath,
      caption: formData.get('caption') as string || null,
      credit: formData.get('credit') as string || null,
      position: 0,
      metadata_json: {
        original_name: file.name,
        size: file.size,
        mime: file.type,
        public_url: urlData.publicUrl,
      },
    })
    .select('id')
    .single();

  if (assetError) {
    return NextResponse.json({ error: assetError.message }, { status: 500 });
  }

  return NextResponse.json({
    id: asset.id,
    path: filePath,
    url: urlData.publicUrl,
    original_name: file.name,
  }, { status: 201 });
}
