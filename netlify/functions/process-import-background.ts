import type { Config, Context } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

interface ProcessImportBody {
  jobId: string;
}

const ADMIN_ROLES = new Set(['editor', 'admin', 'super_admin']);

const VALID_TYPES = new Set([
  'heading', 'subheading', 'paragraph', 'image', 'caption',
  'quote', 'key_figure', 'timeline', 'sidebar', 'footer',
  'source', 'unknown',
]);

interface OpenAIBlock {
  type: string;
  source_text: string;
  bounding_box: { x: number; y: number; width: number; height: number } | null;
  confidence: number;
  description: string | null;
  caption: string | null;
  credit: string | null;
  is_photo: boolean | null;
}

interface OpenAIPageResult {
  page_number: number;
  blocks: OpenAIBlock[];
}

export default async function processImportBackground(req: Request, _context: Context): Promise<void> {
  const body = (await req.json()) as ProcessImportBody;
  const { jobId } = body;

  if (!jobId) {
    console.error('[bg-import] No jobId provided');
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    console.error('[bg-import] Missing Supabase env vars');
    return;
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`[bg-import] Started — job=${jobId}`);

  try {
    const { data: job, error: jobErr } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();

    if (jobErr || !job) {
      console.error(`[bg-import] Job not found — job=${jobId} error=${jobErr?.message ?? 'null'}`);
      return;
    }

    const sourceFilePath = job.source_file_path as string;
    const sourceType = job.source_type as string;

    await supabase.from('import_jobs').update({
      status: 'processing',
      progress: 5,
      error_message: null,
      processing_started_at: new Date().toISOString(),
      processed_pages: 0,
      failed_pages: 0,
      current_page: 0,
      last_error: null,
    }).eq('id', jobId);

    const downloadResp = await fetch(`${supabaseUrl}/functions/v1/storage-admin?action=download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ path: sourceFilePath }),
    });

    if (!downloadResp.ok) {
      const errText = await downloadResp.text();
      console.error(`[bg-import] Source download failed — status=${downloadResp.status} body=${errText.slice(0, 200)}`);
      await supabase.from('import_jobs').update({
        status: 'failed',
        error_message: 'Fichier source introuvable',
        last_error: `Download failed: ${downloadResp.status}`,
      }).eq('id', jobId);
      return;
    }

    const sourceArrayBuffer = await downloadResp.arrayBuffer();
    console.log(`[bg-import] Source downloaded — size=${(sourceArrayBuffer.byteLength / 1024).toFixed(0)}KB`);

    let pageCount = 0;
    const renderedPaths: { pageNumber: number; thumbnail: string; preview: string; full: string }[] = [];

    if (sourceType === 'pdf') {
      try {
        const mupdf = await import('mupdf');
        const pdfBuffer = Buffer.from(sourceArrayBuffer);
        const doc = mupdf.Document.openDocument(pdfBuffer, 'application/pdf');
        pageCount = doc.countPages();
        console.log(`[bg-import] PDF opened — pages=${pageCount}`);

        await supabase.from('import_jobs').update({
          total_pages: pageCount,
          progress: 10,
        }).eq('id', jobId);

        for (let i = 0; i < pageCount; i++) {
          const page = doc.loadPage(i);
          const padded = String(i + 1).padStart(2, '0');

          const thumbBuf = renderPageToBuffer(page, 400, mupdf);
          await uploadToStorage(supabaseUrl, anonKey, `${jobId}/thumbnails/page-${padded}.png`, thumbBuf);

          const previewBuf = renderPageToBuffer(page, 1200, mupdf);
          await uploadToStorage(supabaseUrl, anonKey, `${jobId}/previews/page-${padded}.png`, previewBuf);

          const fullBuf = renderPageToBuffer(page, 2000, mupdf);
          await uploadToStorage(supabaseUrl, anonKey, `${jobId}/full/page-${padded}.png`, fullBuf);

          renderedPaths.push({
            pageNumber: i + 1,
            thumbnail: `${jobId}/thumbnails/page-${padded}.png`,
            preview: `${jobId}/previews/page-${padded}.png`,
            full: `${jobId}/full/page-${padded}.png`,
          });

          console.log(`[bg-import] Page ${i + 1}/${pageCount} rendered`);
        }

        await supabase.from('import_jobs').update({
          progress: 25,
          page_count: pageCount,
          metadata_json: { ...job.metadata_json, rendered_pages: renderedPaths },
        }).eq('id', jobId);
      } catch (renderErr) {
        const msg = renderErr instanceof Error ? renderErr.message : 'unknown';
        console.error(`[bg-import] PDF rendering failed — ${msg}`);
        await supabase.from('import_jobs').update({
          status: 'failed',
          error_message: `Rendu PDF échec: ${msg}`,
          last_error: msg,
        }).eq('id', jobId);
        return;
      }
    }

    if (pageCount === 0) {
      await supabase.from('import_jobs').update({
        status: 'failed',
        error_message: 'Aucune page rendue',
      }).eq('id', jobId);
      return;
    }

    // Delete old blocks for this job (idempotent retry)
    await supabase.from('extracted_blocks').delete().eq('import_job_id', jobId);
    await supabase.from('ai_suggestions').delete().eq('import_job_id', jobId);

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/openai-vision`;
    let processedPages = 0;
    let failedPages = 0;
    const allTypedParagraphs: { type: string; page: number; text: string }[] = [];

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      await supabase.from('import_jobs').update({
        current_page: pageNum,
        progress: 25 + Math.round((processedPages / pageCount) * 70),
      }).eq('id', jobId);

      try {
        const pageImagePath = `${jobId}/full/page-${String(pageNum).padStart(2, '0')}.png`;
        const pageDownloadResp = await fetch(`${supabaseUrl}/functions/v1/storage-admin?action=download`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
          body: JSON.stringify({ path: pageImagePath }),
        });

        if (!pageDownloadResp.ok) {
          console.warn(`[bg-import] Page ${pageNum} image not found`);
          failedPages++;
          await supabase.from('import_jobs').update({
            processed_pages: processedPages,
            failed_pages: failedPages,
          }).eq('id', jobId);
          continue;
        }

        const pageImageBuffer = Buffer.from(await pageDownloadResp.arrayBuffer());
        const base64Image = pageImageBuffer.toString('base64');

        const pageStart = Date.now();
        const pageAnalysis = await analyzePageWithOpenAI(edgeFunctionUrl, anonKey, base64Image, pageNum);
        const pageDuration = Date.now() - pageStart;
        console.log(`[bg-import] Page ${pageNum}/${pageCount} — blocks=${pageAnalysis.blocks?.length ?? 0} duration=${pageDuration}ms`);

        // Delete existing blocks for this page (idempotent retry)
        await supabase.from('extracted_blocks')
          .delete()
          .eq('import_job_id', jobId)
          .eq('page_number', pageNum);

        const blockInserts = (pageAnalysis.blocks ?? []).map((blk) => {
          const blockType = VALID_TYPES.has(blk.type) ? blk.type : 'unknown';
          const confidence = typeof blk.confidence === 'number' ? blk.confidence : 0.5;

          allTypedParagraphs.push({ type: blockType, page: pageNum, text: blk.source_text ?? '' });

          return {
            import_job_id: jobId,
            page_number: pageNum,
            type: blockType,
            source_text: blk.source_text ?? '',
            bounding_box_json: blk.bounding_box ?? null,
            confidence,
            asset_path: null,
            status: 'pending',
          };
        });

        if (blockInserts.length > 0) {
          const { error: blockErr } = await supabase.rpc('insert_extracted_blocks_batch', {
            p_job_id: jobId,
            p_blocks: blockInserts,
          });

          if (blockErr) {
            console.error(`[bg-import] Block insert failed for page ${pageNum}: ${blockErr.message}`);
            const { error: directErr } = await supabase.from('extracted_blocks').insert(blockInserts);
            if (directErr) {
              console.error(`[bg-import] Direct insert also failed for page ${pageNum}: ${directErr.message}`);
            }
          }
        }

        processedPages++;
        await supabase.from('import_jobs').update({
          processed_pages: processedPages,
          failed_pages: failedPages,
          progress: 25 + Math.round((processedPages / pageCount) * 70),
        }).eq('id', jobId);
      } catch (pageErr) {
        const msg = pageErr instanceof Error ? pageErr.message : 'unknown';
        console.error(`[bg-import] Page ${pageNum} failed: ${msg}`);
        failedPages++;
        await supabase.from('import_jobs').update({
          processed_pages: processedPages,
          failed_pages: failedPages,
          last_error: `Page ${pageNum}: ${msg}`,
        }).eq('id', jobId);
      }
    }

    // Infer articles from all typed paragraphs
    const potentialArticles = inferArticles(allTypedParagraphs);
    const suggestionInserts = potentialArticles.map((a) => ({
      import_job_id: jobId,
      suggestion_type: 'article_grouping',
      suggestion_json: {
        title: a.title,
        pageRange: a.pageRange,
        blockIndices: a.blockIndices,
        proposedFormat: a.proposedFormat,
        proposedCategory: a.proposedCategory,
      },
      status: 'pending',
    }));

    if (suggestionInserts.length > 0) {
      await supabase.from('ai_suggestions').insert(suggestionInserts);
    }

    // Final status
    const finalStatus = failedPages === 0 ? 'needs_review' : (processedPages > 0 ? 'needs_review' : 'failed');
    await supabase.from('import_jobs').update({
      status: finalStatus,
      progress: 100,
      processed_pages: processedPages,
      failed_pages: failedPages,
      current_page: pageCount,
      processing_completed_at: new Date().toISOString(),
      error_message: failedPages > 0 ? `${failedPages} page(s) en échec sur ${pageCount}` : null,
    }).eq('id', jobId);

    console.log(`[bg-import] Completed — job=${jobId} processed=${processedPages} failed=${failedPages} status=${finalStatus}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error(`[bg-import] Fatal error — job=${jobId} error=${msg}`);
    await supabase.from('import_jobs').update({
      status: 'failed',
      error_message: msg,
      last_error: msg,
      processing_completed_at: new Date().toISOString(),
    }).eq('id', jobId);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderPageToBuffer(page: any, targetWidth: number, mupdf: any): Buffer {
  const bounds = page.getBounds();
  const originalWidth = bounds[2] - bounds[0];
  const scale = targetWidth / originalWidth;
  const ctm = [scale, 0, 0, scale, 0, 0];
  const pixmap = page.toPixmap(ctm, mupdf.ColorSpace.DeviceRGB, false);
  const pngData = pixmap.asPNG();
  return Buffer.from(pngData);
}

async function uploadToStorage(supabaseUrl: string, anonKey: string, path: string, data: Buffer): Promise<void> {
  const formData = new FormData();
  formData.append('file', new Blob([data], { type: 'image/png' }));
  formData.append('path', path);
  formData.append('contentType', 'image/png');

  const resp = await fetch(`${supabaseUrl}/functions/v1/storage-admin?action=upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${anonKey}` },
    body: formData,
  });

  if (!resp.ok) {
    const ct = resp.headers.get('content-type') || '';
    let errMsg = `Upload failed: ${resp.status}`;
    if (ct.includes('application/json')) {
      const errBody = await resp.json() as { error?: string };
      errMsg = `Upload failed: ${errBody.error ?? resp.status}`;
    } else {
      const text = await resp.text();
      errMsg = `Upload failed (${resp.status}): ${text.slice(0, 200)}`;
    }
    throw new Error(errMsg);
  }
}

async function analyzePageWithOpenAI(
  edgeFunctionUrl: string,
  anonKey: string,
  base64Image: string,
  pageNumber: number,
): Promise<OpenAIPageResult> {
  const resp = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ imageBase64: base64Image, pageNumber }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`OpenAI Vision error (${resp.status}): ${errText.slice(0, 300)}`);
  }

  const contentType = resp.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await resp.text();
    throw new Error(`OpenAI Vision: non-JSON response (${resp.status}): ${text.slice(0, 300)}`);
  }

  return await resp.json() as OpenAIPageResult;
}

interface PotentialArticle {
  title: string;
  pageRange: string;
  blockIndices: number[];
  proposedFormat: string;
  proposedCategory: string;
}

function inferArticles(paragraphs: { type: string; page: number; text: string }[]): PotentialArticle[] {
  const articles: PotentialArticle[] = [];
  let currentArticle: PotentialArticle | null = null;
  let articleStartPage = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    if (p.type === 'heading') {
      if (currentArticle) {
        currentArticle.pageRange = `${articleStartPage}–${p.page}`;
        articles.push(currentArticle);
      }
      currentArticle = {
        title: p.text.slice(0, 120),
        pageRange: `${p.page}–${p.page}`,
        blockIndices: [i],
        proposedFormat: 'analyse',
        proposedCategory: 'politique-institutions',
      };
      articleStartPage = p.page;
    } else if (currentArticle) {
      currentArticle.blockIndices.push(i);
    }
  }

  if (currentArticle) {
    articles.push(currentArticle);
  }

  return articles;
}

export const config: Config = {
  path: '/process-import-background',
};
