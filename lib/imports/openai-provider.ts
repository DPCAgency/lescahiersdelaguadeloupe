import type { DocumentAnalysisProvider, AnalysisInput, AnalysisResult, ExtractedBlockData, PotentialArticle } from './types';
import { getSupabaseUrl, getSupabaseAnonKey, getStorageAdminUrl } from '@/lib/supabase/env';

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

const VALID_TYPES = new Set([
  'heading', 'subheading', 'paragraph', 'image', 'caption',
  'quote', 'key_figure', 'timeline', 'sidebar', 'footer',
  'source', 'unknown',
]);

export class OpenAIVisionProvider implements DocumentAnalysisProvider {
  private model: string;
  private edgeFunctionUrl: string;
  private anonKey: string;

  constructor(_apiKey: string, model = 'gpt-4o') {
    this.model = model;
    this.edgeFunctionUrl = `${getSupabaseUrl()}/functions/v1/openai-vision`;
    this.anonKey = getSupabaseAnonKey();
  }

  async analyze(input: AnalysisInput): Promise<AnalysisResult> {
    const { supabaseAdmin } = await import('@/lib/supabase/server');
    const { extractPageRegion } = await import('./pdf-renderer');

    const jobId = input.jobId;
    const sourceFilePath = input.metadata?.sourceFilePath as string;

    const downloadResp = await fetch(
      getStorageAdminUrl('download'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.anonKey}`,
        },
        body: JSON.stringify({ path: sourceFilePath }),
      },
    );

    if (!downloadResp.ok) {
      throw new Error('OpenAI: impossible de télécharger le fichier source depuis Storage.');
    }

    const sourceArrayBuffer = await downloadResp.arrayBuffer();

    const blocks: ExtractedBlockData[] = [];
    const typedParagraphs: { type: string; page: number; text: string }[] = [];
    const pageCount = input.pageCount;

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const pageImagePath = `${jobId}/full/page-${String(pageNum).padStart(2, '0')}.png`;
      const pageStart = Date.now();

      try {
        const pageDownloadResp = await fetch(
          getStorageAdminUrl('download'),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.anonKey}`,
            },
            body: JSON.stringify({ path: pageImagePath }),
          },
        );

        if (!pageDownloadResp.ok) {
          console.warn(`[openai] Page image not found: ${pageImagePath}`);
          continue;
        }

        const pageImageBuffer = Buffer.from(await pageDownloadResp.arrayBuffer());
        const base64Image = pageImageBuffer.toString('base64');

        const pageAnalysis = await this.analyzePage(base64Image, pageNum);
        const pageBlockCount = pageAnalysis.blocks?.length ?? 0;
        const pageDuration = Date.now() - pageStart;
        console.log(`[openai] Page ${pageNum}/${pageCount} — blocks=${pageBlockCount} duration=${pageDuration}ms`);

        for (const blk of pageAnalysis.blocks ?? []) {
        const blockType = VALID_TYPES.has(blk.type) ? blk.type : 'unknown';
        const confidence = typeof blk.confidence === 'number' ? blk.confidence : 0.5;

        let assetPath: string | undefined = undefined;

        if (blockType === 'image' && blk.bounding_box && blk.bounding_box.width > 0 && blk.bounding_box.height > 0 && confidence >= 0.5) {
          try {
            const cropBuf = await extractPageRegion(
              pageImageBuffer,
              blk.bounding_box,
              2000,
              2800,
            );

            const imgId = `img-p${pageNum}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            assetPath = `${jobId}/figures/${imgId}.png`;

            const uploadFormData = new FormData();
            uploadFormData.append('file', new Blob([cropBuf], { type: 'image/png' }));
            uploadFormData.append('path', assetPath);
            uploadFormData.append('contentType', 'image/png');

            const uploadResp = await fetch(
              getStorageAdminUrl('upload'),
              {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.anonKey}` },
                body: uploadFormData,
              },
            );

            if (uploadResp.ok) {
              await supabaseAdmin.from('issue_assets').insert({
                issue_id: null,
                page_id: null,
                asset_type: 'image',
                file_path: assetPath,
                caption: blk.caption ?? null,
                credit: blk.credit ?? null,
                position: blocks.filter((b) => b.page_number === pageNum && b.type === 'image').length,
                metadata_json: {
                  source: 'pdf_extraction',
                  analysis_provider: 'openai',
                  original_page: pageNum,
                  bounding_box: blk.bounding_box,
                  confidence,
                  description: blk.description ?? null,
                  is_photo: blk.is_photo ?? null,
                  status: confidence < 0.7 ? 'needs_review' : 'validated',
                },
              });
            }
          } catch (err) {
            console.warn(`[openai] Figure extraction failed on page ${pageNum}: ${err instanceof Error ? err.message : 'unknown'}`);
          }
        }

        blocks.push({
          page_number: pageNum,
          type: blockType,
          source_text: blk.source_text ?? '',
          bounding_box_json: blk.bounding_box ?? null,
          confidence,
          asset_path: assetPath,
        });
        typedParagraphs.push({ type: blockType, page: pageNum, text: blk.source_text ?? '' });
      }
      } catch (pageErr) {
        console.error(`[openai] Page ${pageNum} failed: ${pageErr instanceof Error ? pageErr.message : 'unknown'}`);
        blocks.push({
          page_number: pageNum,
          type: 'unknown',
          source_text: '',
          bounding_box_json: null,
          confidence: 0,
        });
      }
    }

    blocks.sort((a, b) => a.page_number - b.page_number);

    const potentialArticles = this.inferArticles(typedParagraphs);

    return { blocks, pageCount, potentialArticles };
  }

  private async analyzePage(base64Image: string, pageNumber: number): Promise<OpenAIPageResult> {
    const resp = await fetch(this.edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.anonKey}`,
      },
      body: JSON.stringify({ imageBase64: base64Image, pageNumber }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`OpenAI Vision error (${resp.status}): ${errText.slice(0, 300)}`);
    }

    const data = await resp.json() as OpenAIPageResult;
    return data;
  }

  private inferArticles(paragraphs: { type: string; page: number; text: string }[]): PotentialArticle[] {
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
}
