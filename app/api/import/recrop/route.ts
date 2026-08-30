import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { extractPageRegion } from '@/lib/imports/pdf-renderer';
import { getSupabaseAnonKey, getStorageAdminUrl } from '@/lib/supabase/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

interface RecropRequest {
  jobId: string;
  blockId: string;
  boundingBox: { x: number; y: number; width: number; height: number };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as RecropRequest;
    const { jobId, blockId, boundingBox } = body;

    if (!jobId || !blockId || !boundingBox) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    if (boundingBox.x < 0 || boundingBox.y < 0 || boundingBox.width <= 0 || boundingBox.height <= 0 ||
        boundingBox.x + boundingBox.width > 1 || boundingBox.y + boundingBox.height > 1) {
      return NextResponse.json({ error: 'Coordonnées invalides (doivent être normalisées 0-1)' }, { status: 400 });
    }

    const { data: block } = await supabaseAdmin
      .from('extracted_blocks')
      .select('*')
      .eq('id', blockId)
      .maybeSingle();

    if (!block) {
      return NextResponse.json({ error: 'Bloc introuvable' }, { status: 404 });
    }

    const pageNum = block.page_number;
    const pageImagePath = `${jobId}/full/page-${String(pageNum).padStart(2, '0')}.png`;

    const downloadResp = await fetch(getStorageAdminUrl('download'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getSupabaseAnonKey()}`,
      },
      body: JSON.stringify({ path: pageImagePath }),
    });

    if (!downloadResp.ok) {
      return NextResponse.json({ error: 'Image de page introuvable' }, { status: 404 });
    }

    const pageBuffer = Buffer.from(await downloadResp.arrayBuffer());

    const cropBuffer = await extractPageRegion(
      pageBuffer,
      boundingBox,
      2000,
      2800,
    );

    const assetId = `recrop-p${pageNum}-${Date.now()}`;
    const assetPath = `${jobId}/figures/${assetId}.png`;

    const cropFormData = new FormData();
    cropFormData.append('file', new Blob([cropBuffer], { type: 'image/png' }));
    cropFormData.append('path', assetPath);
    cropFormData.append('contentType', 'image/png');

    const uploadResp = await fetch(getStorageAdminUrl('upload'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getSupabaseAnonKey()}`,
      },
      body: cropFormData,
    });

    if (!uploadResp.ok) {
      const errBody = await uploadResp.json() as { error?: string };
      throw new Error(`Upload échoué: ${errBody.error ?? uploadResp.status}`);
    }

    await supabaseAdmin.from('extracted_blocks').update({
      bounding_box_json: boundingBox,
      asset_path: assetPath,
      status: 'modified',
    }).eq('id', blockId);

    await supabaseAdmin.from('issue_assets').insert({
      issue_id: null,
      page_id: null,
      asset_type: 'image',
      file_path: assetPath,
      caption: block.source_text,
      credit: null,
      position: 0,
      metadata_json: {
        source: 'pdf_extraction',
        analysis_provider: 'manual_recrop',
        original_page: pageNum,
        bounding_box: boundingBox,
        confidence: 1.0,
        status: 'validated',
      },
    });

    return NextResponse.json({
      success: true,
      assetPath,
      boundingBox,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error(`[recrop] Error: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
