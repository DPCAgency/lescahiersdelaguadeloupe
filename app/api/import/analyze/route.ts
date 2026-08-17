import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getAnalysisProvider, getProviderMode } from '@/lib/imports/provider-factory';
import { renderPdfPages, type StorageUploader } from '@/lib/imports/pdf-renderer';
import { getSupabaseUrl, getSupabaseAnonKey, getStorageAdminUrl } from '@/lib/supabase/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const ADMIN_ROLES = new Set(['editor', 'admin', 'super_admin']);

function createJwtClient(req: NextRequest): SupabaseClient | null {
  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  const token = req.cookies.get('sb-access-token')?.value;
  if (!token) return null;
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function verifyAdminAndCreateClient(req: NextRequest): Promise<{ client: SupabaseClient; userId: string } | null> {
  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  const token = req.cookies.get('sb-access-token')?.value;
  if (!token) return null;

  const authClient = createClient(supabaseUrl, anonKey);
  const { data: userData } = await authClient.auth.getUser(token);
  if (!userData?.user?.id) return null;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profile } = await userClient
    .from('profiles')
    .select('role, status')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (!profile || !ADMIN_ROLES.has(profile.role) || profile.status !== 'active') return null;

  return { client: userClient, userId: userData.user.id };
}

async function dbUpdate(db: SupabaseClient, jobId: string, updates: Record<string, unknown>): Promise<void> {
  const { error } = await db.from('import_jobs').update(updates).eq('id', jobId);
  if (error) console.error(`[import] DB update error — job=${jobId} error=${error.message}`);
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let jobId: string | undefined;

  try {
    const auth = await verifyAdminAndCreateClient(req);
    if (!auth) {
      return NextResponse.json({ error: 'Session expirée ou accès refusé' }, { status: 401 });
    }

    const db = auth.client;

    const body = await req.json() as { jobId: string };
    jobId = body.jobId;

    if (!jobId) {
      return NextResponse.json({ error: 'jobId requis' }, { status: 400 });
    }

    console.log(`[import] Analysis started — job=${jobId}`);

    const { data: job, error: jobErr } = await db
      .from('import_jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();

    if (jobErr) {
      console.error(`[import] Job query error — job=${jobId} error=${jobErr.message}`);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    if (!job) {
      console.log(`[import] Job not found — job=${jobId}`);
      return NextResponse.json({ error: 'Import introuvable' }, { status: 404 });
    }

    if (job.status !== 'uploaded' && job.status !== 'failed' && job.status !== 'needs_review') {
      console.log(`[import] Job already analyzed — job=${jobId} status=${job.status}`);
      return NextResponse.json({ error: 'Cet import a déjà été analysé' }, { status: 400 });
    }

    const { error: delBlocksErr } = await db.from('extracted_blocks').delete().eq('import_job_id', jobId);
    if (delBlocksErr) console.warn(`[import] Delete blocks error — ${delBlocksErr.message}`);

    const { error: delSuggErr } = await db.from('ai_suggestions').delete().eq('import_job_id', jobId);
    if (delSuggErr) console.warn(`[import] Delete suggestions error — ${delSuggErr.message}`);

    await dbUpdate(db, jobId, { status: 'processing', progress: 5, error_message: null });

    let arrayBuffer: ArrayBuffer;

    console.log(`[import] Downloading source file — job=${jobId} path=${job.source_file_path}`);

    const downloadResp = await fetch(getStorageAdminUrl('download'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getSupabaseAnonKey()}`,
      },
      body: JSON.stringify({ path: job.source_file_path }),
    });

    if (downloadResp.ok) {
      arrayBuffer = await downloadResp.arrayBuffer();
      console.log(`[import] File downloaded — job=${jobId} size=${(arrayBuffer.byteLength / 1024).toFixed(0)}KB status=${downloadResp.status}`);
    } else {
      console.error(`[import] Download failed — job=${jobId} status=${downloadResp.status}`);
      await dbUpdate(db, jobId, { status: 'failed', error_message: 'Fichier source introuvable' });
      return NextResponse.json({ error: 'Fichier source introuvable' }, { status: 500 });
    }

    await dbUpdate(db, jobId, { progress: 15 });

    let pageCount = 0;
    let renderedPaths: { pageNumber: number; thumbnail: string; preview: string; full: string }[] = [];

    if (job.source_type === 'pdf') {
      console.log(`[import] Starting PDF rendering — job=${jobId} pdfBytes=${arrayBuffer.byteLength}`);

      const uploader: StorageUploader = {
        async upload(path, data, contentType) {
          const formData = new FormData();
          formData.append('file', new Blob([data], { type: contentType }));
          formData.append('path', path);
          formData.append('contentType', contentType);

          const resp = await fetch(getStorageAdminUrl('upload'), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getSupabaseAnonKey()}` },
            body: formData,
          });

          if (!resp.ok) {
            let errMsg = `Storage upload failed: ${resp.status}`;
            const ct = resp.headers.get('content-type') || '';
            if (ct.includes('application/json')) {
              const errBody = await resp.json() as { error?: string };
              errMsg = `Storage upload failed: ${errBody.error ?? resp.status}`;
            } else {
              const text = await resp.text();
              errMsg = `Storage upload failed (${resp.status}): ${text.slice(0, 200)}`;
            }
            throw new Error(errMsg);
          }
        },
      };

      try {
        const rendered = await renderPdfPages(arrayBuffer, jobId, uploader);
        pageCount = rendered.length;

        renderedPaths = rendered.map((r) => ({
          pageNumber: r.pageNumber,
          thumbnail: r.thumbnailPath,
          preview: r.previewPath,
          full: r.fullPath,
        }));

        console.log(`[import] PDF rendered — job=${jobId} pages=${pageCount}`);
      } catch (renderErr) {
        const msg = renderErr instanceof Error ? renderErr.message : 'unknown';
        console.error(`[import] PDF rendering FAILED — job=${jobId} error=${msg}`);
        await dbUpdate(db, jobId, { status: 'failed', error_message: `Rendu PDF échec: ${msg}` });
        return NextResponse.json({ error: `Rendu PDF échec: ${msg}` }, { status: 500 });
      }

      if (pageCount === 0) {
        console.error(`[import] 0 pages rendered — job=${jobId}`);
        await dbUpdate(db, jobId, { status: 'failed', error_message: 'Aucune page rendue' });
        return NextResponse.json({ error: 'Aucune page rendue' }, { status: 500 });
      }
    }

    await dbUpdate(db, jobId, { progress: 30, page_count: pageCount || null });

    const provider = getAnalysisProvider();
    const mode = getProviderMode();
    console.log(`[import] Provider=${mode} — job=${jobId} pages=${pageCount}`);

    const analyzeStart = Date.now();
    const result = await provider.analyze({
      jobId,
      sourceType: job.source_type,
      pageCount: pageCount || ((job.metadata_json as { page_count?: number })?.page_count ?? 11),
      metadata: { ...job.metadata_json, sourceFilePath: job.source_file_path },
    });

    const analyzeDuration = Date.now() - analyzeStart;
    console.log(`[import] Analysis complete — job=${jobId} pages=${result.pageCount} blocks=${result.blocks.length} articles=${result.potentialArticles.length} duration=${analyzeDuration}ms`);

    if (result.blocks.length === 0) {
      console.error(`[import] 0 blocks extracted — job=${jobId}`);
      await dbUpdate(db, jobId, { status: 'failed', error_message: 'Aucun bloc extrait par l\'analyse IA' });
      return NextResponse.json({ error: 'Aucun bloc extrait par l\'analyse IA' }, { status: 500 });
    }

    await dbUpdate(db, jobId, { progress: 70, page_count: result.pageCount });

    const blockInserts = result.blocks.map((b) => ({
      import_job_id: jobId,
      page_number: b.page_number,
      type: b.type,
      source_text: b.source_text,
      bounding_box_json: b.bounding_box_json,
      confidence: b.confidence,
      asset_path: b.asset_path ?? null,
      status: 'pending',
    }));

    const { error: blockError } = await db.rpc('insert_extracted_blocks_batch', {
      p_job_id: jobId,
      p_blocks: blockInserts,
    });
    if (blockError) {
      console.error(`[import] Block insert failed — job=${jobId} error=${blockError.message}`);
      throw new Error(`Échec insertion blocs: ${blockError.message}`);
    }

    console.log(`[import] Blocks inserted — job=${jobId} count=${blockInserts.length}`);

    const suggestionInserts = result.potentialArticles.map((a) => ({
      import_job_id: jobId,
      suggestion_type: 'article_grouping',
      suggestion_json: {
        title: a.title,
        pageRange: a.pageRange,
        blockIndices: a.blockIndices,
        proposedFormat: a.proposedFormat,
        proposedCategory: a.proposedCategory,
        proposedHeroImage: a.proposedHeroImage,
      },
      status: 'pending',
    }));

    if (suggestionInserts.length > 0) {
      const { error: suggError } = await db.from('ai_suggestions').insert(suggestionInserts);
      if (suggError) {
        console.error(`[import] Suggestion insert failed — job=${jobId} error=${suggError.message}`);
      }
    }

    await dbUpdate(db, jobId, {
      status: 'needs_review',
      progress: 100,
      completed_at: new Date().toISOString(),
      metadata_json: {
        ...job.metadata_json,
        rendered_pages: renderedPaths,
      },
    });

    const totalDuration = Date.now() - startTime;
    console.log(`[import] Job finalized — job=${jobId} status=needs_review totalDuration=${totalDuration}ms`);

    const typeCounts: Record<string, number> = {};
    for (const b of result.blocks) {
      typeCounts[b.type] = (typeCounts[b.type] ?? 0) + 1;
    }
    const lowConf = result.blocks.filter((b) => b.confidence < 0.7).length;
    const figuresWithAssets = result.blocks.filter((b) => b.type === 'image' && b.asset_path).length;
    const figuresFallback = result.blocks.filter((b) => b.type === 'image' && !b.asset_path).length;

    return NextResponse.json({
      success: true,
      jobId,
      mode,
      pageCount: result.pageCount,
      blockCount: result.blocks.length,
      articleCount: result.potentialArticles.length,
      duration: totalDuration,
      typeCounts,
      lowConfidenceCount: lowConf,
      figuresWithAssets,
      figuresFallback,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error(`[import] Analysis failed — error=${message}`);

    if (jobId) {
      const errClient = createJwtClient(req);
      if (errClient) {
        try {
          await errClient.from('import_jobs').update({
            status: 'failed',
            error_message: message,
          }).eq('id', jobId);
        } catch { /* ignore */ }
      }
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
