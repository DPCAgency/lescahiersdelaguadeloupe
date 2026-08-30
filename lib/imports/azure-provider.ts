import type { DocumentAnalysisProvider, AnalysisInput, AnalysisResult, ExtractedBlockData, PotentialArticle } from './types';

interface AzureParagraph {
  content: string;
  role?: string;
  boundingRegions?: { pageNumber: number; polygon: { x: number; y: number }[] }[];
  spans?: { offset: number; length: number }[];
}

interface AzurePage {
  pageNumber: number;
  width: number;
  height: number;
  lines?: { content: string; polygon: { x: number; y: number }[] }[];
  selectionMarks?: { state: string; polygon: { x: number; y: number }[] }[];
}

interface AzureFigure {
  id: string;
  boundingRegions?: { pageNumber: number; polygon: { x: number; y: number }[] }[];
}

interface AzureAnalyzeResult {
  pages?: AzurePage[];
  paragraphs?: AzureParagraph[];
  figures?: AzureFigure[];
  tables?: { id: string; boundingRegions?: { pageNumber: number; polygon: { x: number; y: number }[] }[] }[];
}

function polygonToBoundingBox(polygon: { x: number; y: number }[], pageWidth: number, pageHeight: number) {
  if (!polygon || polygon.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  const xs = polygon.map((p) => p.x);
  const ys = polygon.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    x: minX / pageWidth,
    y: minY / pageHeight,
    width: (maxX - minX) / pageWidth,
    height: (maxY - minY) / pageHeight,
  };
}

function mapRoleToType(role: string | undefined): string {
  if (!role) return 'paragraph';
  const r = role.toLowerCase();
  if (r === 'title' || r === 'sectionheading') return 'heading';
  if (r === 'subtitle') return 'subheading';
  if (r === 'pageheader' || r === 'pagefooter') return 'footer';
  return 'paragraph';
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

export class AzureDocumentAnalysisProvider implements DocumentAnalysisProvider {
  private endpoint: string;
  private apiKey: string;

  constructor(endpoint: string, apiKey: string) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  async analyze(input: AnalysisInput): Promise<AnalysisResult> {
    const { supabaseAdmin } = await import('@/lib/supabase/server');

    const { data: fileData } = await supabaseAdmin.storage
      .from('imports-private')
      .download(input.metadata?.sourceFilePath as string);

    if (!fileData) {
      throw new Error('Impossible de télécharger le fichier source depuis le stockage.');
    }

    const arrayBuffer = await fileData.arrayBuffer();

    const analyzeUrl = `${this.endpoint}/documentintelligence/documentModels/prebuilt-layout:analyze?api-version=2024-11-30`;

    const uploadResp = await fetch(analyzeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Ocp-Apim-Subscription-Key': this.apiKey,
      },
      body: arrayBuffer,
    });

    if (!uploadResp.ok) {
      const errText = await uploadResp.text();
      throw new Error(`Azure: échec de l'upload (${uploadResp.status}): ${errText.slice(0, 200)}`);
    }

    const operationLocation = uploadResp.headers.get('operation-location');
    if (!operationLocation) {
      throw new Error('Azure: pas d\'URL de résultat retournée.');
    }

    let result: AzureAnalyzeResult | null = null;
    let attempts = 0;
    const maxAttempts = 120;

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 2000));
      const statusResp = await fetch(operationLocation, {
        headers: { 'Ocp-Apim-Subscription-Key': this.apiKey },
      });
      const statusBody = await statusResp.json() as { status: string; analyzeResult?: AzureAnalyzeResult; error?: { message: string } };

      if (statusBody.status === 'succeeded') {
        result = statusBody.analyzeResult ?? null;
        break;
      }
      if (statusBody.status === 'failed') {
        throw new Error(`Azure: analyse échouée · ${statusBody.error?.message ?? 'Erreur inconnue'}`);
      }
      attempts++;
    }

    if (!result) {
      throw new Error('Azure: délai d\'attente dépassé.');
    }

    return this.normalize(result, arrayBuffer, input);
  }

  private async normalize(
    result: AzureAnalyzeResult,
    arrayBuffer: ArrayBuffer,
    input: AnalysisInput,
  ): Promise<AnalysisResult> {
    const pages = result.pages ?? [];
    const pageCount = pages.length;

    const pageDims = new Map<number, { width: number; height: number }>();
    for (const page of pages) {
      pageDims.set(page.pageNumber, { width: page.width || 612, height: page.height || 792 });
    }

    const blocks: ExtractedBlockData[] = [];
    const typedParagraphs: { type: string; page: number; text: string }[] = [];

    for (const para of result.paragraphs ?? []) {
      const region = para.boundingRegions?.[0];
      const pageNum = region?.pageNumber ?? 1;
      const dims = pageDims.get(pageNum) ?? { width: 612, height: 792 };
      const polygon = region?.polygon ?? [];
      const bbox = polygonToBoundingBox(polygon, dims.width, dims.height);
      const type = mapRoleToType(para.role);
      const text = para.content ?? '';

      blocks.push({
        page_number: pageNum,
        type,
        source_text: text,
        bounding_box_json: bbox,
        confidence: para.role ? 0.92 : 0.78,
      });

      typedParagraphs.push({ type, page: pageNum, text });
    }

    const { extractPageRegion } = await import('./pdf-renderer');
    const { supabaseAdmin } = await import('@/lib/supabase/server');
    const jobId = input.jobId;

    for (const figure of result.figures ?? []) {
      const region = figure.boundingRegions?.[0];
      const pageNum = region?.pageNumber ?? 1;
      const dims = pageDims.get(pageNum) ?? { width: 612, height: 792 };
      const polygon = region?.polygon ?? [];
      const bbox = polygonToBoundingBox(polygon, dims.width, dims.height);

      let assetPath: string | undefined = undefined;

      if (bbox.width > 0 && bbox.height > 0) {
        try {
          const { data: pageImage } = await supabaseAdmin.storage
            .from('imports-private')
            .download(`${jobId}/full/page-${String(pageNum).padStart(2, '0')}.png`);

          if (pageImage) {
            const pageBuffer = Buffer.from(await pageImage.arrayBuffer());
            const cropBuffer = await extractPageRegion(
              pageBuffer,
              bbox,
              dims.width,
              dims.height,
            );

            assetPath = `${jobId}/figures/${figure.id}.png`;
            await supabaseAdmin.storage
              .from('imports-private')
              .upload(assetPath, cropBuffer, { contentType: 'image/png', upsert: true });
          }
        } catch (err) {
          console.warn(`[azure] Figure fallback crop failed for ${figure.id}: ${err instanceof Error ? err.message : 'unknown'}`);
        }
      }

      blocks.push({
        page_number: pageNum,
        type: 'image',
        source_text: '',
        bounding_box_json: bbox,
        confidence: 0.85,
        asset_path: assetPath,
      });
    }

    blocks.sort((a, b) => a.page_number - b.page_number);

    const potentialArticles = inferArticles(typedParagraphs);

    return {
      blocks,
      pageCount,
      potentialArticles,
    };
  }
}
