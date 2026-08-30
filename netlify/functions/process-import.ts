import type { Config, Context } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

interface ProcessImportBody {
  jobId: string;
}

const VALID_TYPES = new Set([
  'heading', 'subheading', 'paragraph', 'image', 'caption',
  'quote', 'key_figure', 'timeline', 'sidebar', 'footer',
  'source', 'unknown',
]);

interface AnalysisResult {
  document: { title: string; page_count: number };
  blocks: Array<{
    page_number: number;
    block_type: string;
    source_text: string;
    confidence: number;
    visual_description?: string | null;
    caption?: string | null;
    article_group_hint?: string | null;
    category_hint?: string | null;
    format_hint?: string | null;
  }>;
  article_groups: Array<{
    proposed_title: string;
    pages: number[];
    block_indexes: number[];
    proposed_format?: string;
    proposed_category?: string;
  }>;
}

export default async function processImport(req: Request, _context: Context): Promise<void> {
  const body = (await req.json()) as ProcessImportBody;
  const { jobId } = body;

  if (!jobId) {
    console.error('[process-import] No jobId provided');
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !anonKey) {
    console.error('[process-import] Missing Supabase env vars');
    return;
  }
  if (!openaiKey) {
    console.error('[process-import] Missing OPENAI_API_KEY');
    await updateJobProgress(jobId, supabaseUrl, anonKey, {
      p_status: 'failed',
      p_error_message: 'Configuration OpenAI manquante',
      p_last_error: 'OPENAI_API_KEY not set',
    });
    return;
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const openai = new OpenAI({ apiKey: openaiKey });

  console.log(`[process-import] Started · job=${jobId}`);

  try {
    // 1. Get job
    const { data: job, error: jobErr } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();

    if (jobErr || !job) {
      console.error(`[process-import] Job not found · job=${jobId}`);
      return;
    }

    const sourceFilePath = job.source_file_path as string;

    // 2. Set status to processing
    await updateJobProgress(jobId, supabaseUrl, anonKey, {
      p_status: 'processing',
      p_progress: 5,
      p_error_message: null,
      p_last_error: null,
    });

    // 3. Download PDF from Storage
    console.log(`[process-import] Downloading PDF · path=${sourceFilePath}`);
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
      console.error(`[process-import] PDF download failed · status=${downloadResp.status}`);
      await updateJobProgress(jobId, supabaseUrl, anonKey, {
        p_status: 'failed',
        p_error_message: 'Fichier PDF introuvable dans le stockage',
        p_last_error: `Download failed: ${downloadResp.status} ${errText.slice(0, 200)}`,
      });
      return;
    }

    const pdfBuffer = Buffer.from(await downloadResp.arrayBuffer());
    console.log(`[process-import] PDF downloaded · size=${(pdfBuffer.length / 1024 / 1024).toFixed(1)}MB`);

    if (pdfBuffer.length === 0) {
      await updateJobProgress(jobId, supabaseUrl, anonKey, {
        p_status: 'failed',
        p_error_message: 'Le fichier PDF est vide',
      });
      return;
    }

    await updateJobProgress(jobId, supabaseUrl, anonKey, { p_progress: 15 });

    // 4. Upload PDF to OpenAI Files API
    console.log('[process-import] Uploading PDF to OpenAI Files API');
    const filename = (job.metadata_json as { original_filename?: string })?.original_filename ?? 'document.pdf';
    const file = await openai.files.create({
      file: new File([pdfBuffer], filename, { type: 'application/pdf' }),
      purpose: 'user_data',
    });

    console.log(`[process-import] File uploaded to OpenAI · file_id=${file.id}`);
    await updateJobProgress(jobId, supabaseUrl, anonKey, {
      p_progress: 25,
      p_metadata_merge: { openai_file_id: file.id } as unknown as never,
    });

    // 5. Send to OpenAI Responses API with structured output
    console.log('[process-import] Sending to OpenAI Responses API');
    await updateJobProgress(jobId, supabaseUrl, anonKey, { p_progress: 30 });

    const prompt = `Tu es un assistant éditorial spécialisé dans l'analyse de magazines et cahiers d'enquête journalistique.

Analyse ce document PDF dans son intégralité. Extrais TOUS les blocs de contenu éditorial, page par page, dans l'ordre de lecture.

Pour chaque bloc, identifie:
- page_number: le numéro de la page (commence à 1)
- block_type: le type parmi: heading, subheading, paragraph, image, caption, quote, key_figure, timeline, sidebar, footer, unknown
- source_text: le texte EXACT tel qu'il apparaît dans le document (ne pas réécrire ni reformuler)
- confidence: ta confiance dans l'extraction (0.0 à 1.0)
- visual_description: pour les images/figures, une description de l'élément visuel
- caption: la légende associée si présente
- article_group_hint: un indice sur le regroupement d'article auquel ce bloc appartient
- category_hint: une catégorie éditoriale suggérée (politique-institutions, economie, societe, culture, environnement, enquetes)
- format_hint: un format suggéré (analyse, enquete, reportage, portrait, tribune, entretien)

Regroupe ensuite les blocs en articles potentiels:
- proposed_title: titre proposé pour l'article
- pages: liste des numéros de pages concernées
- block_indexes: les index des blocs (0-based) qui composent cet article
- proposed_format: format éditorial suggéré
- proposed_category: catégorie éditoriale suggérée

IMPORTANT:
- source_text doit être une extraction FIDÈLE, pas une reformulation
- Identifie le titre du document et le nombre total de pages
- Traite TOUTES les pages, pas seulement les premières`;

    const response = await openai.responses.create({
      model: 'gpt-4o',
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_file', file_id: file.id },
            { type: 'input_text', text: prompt },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'editorial_analysis',
          schema: {
            type: 'object',
            properties: {
              document: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  page_count: { type: 'number' },
                },
                required: ['title', 'page_count'],
                additionalProperties: false,
              },
              blocks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    page_number: { type: 'number' },
                    block_type: { type: 'string' },
                    source_text: { type: 'string' },
                    confidence: { type: 'number' },
                    visual_description: { type: 'string' },
                    caption: { type: 'string' },
                    article_group_hint: { type: 'string' },
                    category_hint: { type: 'string' },
                    format_hint: { type: 'string' },
                  },
                  required: ['page_number', 'block_type', 'source_text', 'confidence'],
                  additionalProperties: false,
                },
              },
              article_groups: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    proposed_title: { type: 'string' },
                    pages: { type: 'array', items: { type: 'number' } },
                    block_indexes: { type: 'array', items: { type: 'number' } },
                    proposed_format: { type: 'string' },
                    proposed_category: { type: 'string' },
                  },
                  required: ['proposed_title', 'pages', 'block_indexes'],
                  additionalProperties: false,
                },
              },
            },
            required: ['document', 'blocks', 'article_groups'],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    });

    const responseText = response.output_text;
    if (!responseText) {
      console.error('[process-import] No output text from OpenAI');
      await updateJobProgress(jobId, supabaseUrl, anonKey, {
        p_status: 'failed',
        p_error_message: 'OpenAI n\'a retourné aucune analyse',
        p_last_error: 'output_text is empty',
      });
      return;
    }

    let analysis: AnalysisResult;
    try {
      analysis = JSON.parse(responseText) as AnalysisResult;
    } catch {
      console.error('[process-import] Failed to parse OpenAI JSON output');
      await updateJobProgress(jobId, supabaseUrl, anonKey, {
        p_status: 'failed',
        p_error_message: 'Réponse OpenAI non-JSON',
        p_last_error: 'JSON.parse failed',
      });
      return;
    }

    console.log(`[process-import] OpenAI response received · pages=${analysis.document.page_count} blocks=${analysis.blocks.length} articles=${analysis.article_groups.length}`);
    await updateJobProgress(jobId, supabaseUrl, anonKey, {
      p_progress: 80,
      p_total_pages: analysis.document.page_count,
    });

    // 6. Delete old blocks (idempotent)
    await supabase.from('extracted_blocks').delete().eq('import_job_id', jobId);
    await supabase.from('ai_suggestions').delete().eq('import_job_id', jobId);

    // 7. Insert blocks
    const blockInserts = analysis.blocks.map((blk) => {
      const blockType = VALID_TYPES.has(blk.block_type) ? blk.block_type : 'unknown';
      const confidence = typeof blk.confidence === 'number' ? blk.confidence : 0.5;

      return {
        import_job_id: jobId,
        page_number: blk.page_number,
        type: blockType,
        source_text: blk.source_text ?? '',
        bounding_box_json: null,
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
        console.error(`[process-import] Block RPC insert failed: ${blockErr.message}`);
        const { error: directErr } = await supabase.from('extracted_blocks').insert(blockInserts);
        if (directErr) {
          console.error(`[process-import] Direct block insert also failed: ${directErr.message}`);
        }
      }
    }

    console.log(`[process-import] Blocks inserted · count=${blockInserts.length}`);
    await updateJobProgress(jobId, supabaseUrl, anonKey, { p_progress: 90 });

    // 8. Insert article suggestions
    const suggestionInserts = analysis.article_groups.map((group) => ({
      import_job_id: jobId,
      suggestion_type: 'article_grouping',
      suggestion_json: {
        title: group.proposed_title,
        pageRange: group.pages.length > 1 ? `${group.pages[0]}–${group.pages[group.pages.length - 1]}` : `${group.pages[0]}`,
        blockIndices: group.block_indexes,
        proposedFormat: group.proposed_format ?? 'analyse',
        proposedCategory: group.proposed_category ?? 'politique-institutions',
      },
      status: 'pending',
    }));

    if (suggestionInserts.length > 0) {
      const { error: suggErr } = await supabase.from('ai_suggestions').insert(suggestionInserts);
      if (suggErr) {
        console.error(`[process-import] Suggestion insert failed: ${suggErr.message}`);
      }
    }

    // 9. Finalize
    await updateJobProgress(jobId, supabaseUrl, anonKey, {
      p_status: 'needs_review',
      p_progress: 100,
      p_processed_pages: analysis.document.page_count,
      p_current_page: analysis.document.page_count,
      p_metadata_merge: {
        document_title: analysis.document.title,
        openai_analysis: true,
      } as unknown as never,
    });

    // 10. Clean up OpenAI file
    try {
      await openai.files.delete(file.id);
      console.log(`[process-import] OpenAI file deleted · file_id=${file.id}`);
    } catch {
      // non-critical
    }

    console.log(`[process-import] Completed · job=${jobId} blocks=${blockInserts.length} articles=${suggestionInserts.length}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error(`[process-import] Fatal error · job=${jobId} error=${msg}`);
    await updateJobProgress(jobId, supabaseUrl, anonKey, {
      p_status: 'failed',
      p_error_message: msg.slice(0, 500),
      p_last_error: msg,
    });
  }
}

async function updateJobProgress(
  jobId: string,
  supabaseUrl: string,
  anonKey: string,
  params: {
    p_status?: string;
    p_progress?: number;
    p_total_pages?: number;
    p_processed_pages?: number;
    p_failed_pages?: number;
    p_current_page?: number;
    p_error_message?: string | null;
    p_last_error?: string | null;
    p_metadata_merge?: unknown;
  },
): Promise<void> {
  try {
    const body: Record<string, unknown> = { p_job_id: jobId };
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) body[key] = value;
    }

    await fetch(`${supabaseUrl}/rest/v1/rpc/update_import_job_progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error(`[process-import] Failed to update progress: ${err instanceof Error ? err.message : 'unknown'}`);
  }
}

export const config: Config = {
  path: '/process-import',
  background: true,
};
