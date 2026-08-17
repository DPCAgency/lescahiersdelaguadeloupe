import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export interface RenderedPage {
  pageNumber: number;
  width: number;
  height: number;
  thumbnailPath: string;
  previewPath: string;
  fullPath: string;
}

export interface StorageUploader {
  upload(path: string, data: Buffer, contentType: string): Promise<void>;
}

export async function renderPdfPages(
  arrayBuffer: ArrayBuffer,
  storagePrefix: string,
  uploader: StorageUploader,
  options?: { thumbnailWidth?: number; previewWidth?: number; fullWidth?: number }
): Promise<RenderedPage[]> {
  const thumbnailWidth = options?.thumbnailWidth ?? 400;
  const previewWidth = options?.previewWidth ?? 1200;
  const fullWidth = options?.fullWidth ?? 2000;

  try {
    const pdfjsModule = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const pdfjsLib = pdfjsModule.default && typeof pdfjsModule.default.getDocument === 'function'
      ? pdfjsModule.default
      : pdfjsModule;

    console.log('[PDFJS RUNTIME]', {
      version: pdfjsLib.version,
      getDocumentType: typeof pdfjsLib.getDocument,
      keys: Object.keys(pdfjsModule).slice(0, 20),
    });

    if (typeof pdfjsLib.getDocument !== 'function') {
      throw new Error(
        `Invalid PDF.js runtime module: getDocument=${typeof pdfjsLib.getDocument}, exports=${Object.keys(pdfjsModule).join(',')}, defaultType=${typeof pdfjsModule.default}, defaultGetDocument=${typeof pdfjsModule.default?.getDocument}`
      );
    }

    const path = await import('node:path');
    const standardFontDataUrl = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'standard_fonts') + '/';

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: false,
      standardFontDataUrl,
      useWorkerFetch: false,
      isEvalSupported: false,
    });

    const pdf = await loadingTask.promise;
    const results: RenderedPage[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1 });
      const originalWidth = viewport.width;
      const originalHeight = viewport.height;

      const padded = String(i).padStart(2, '0');
      const thumbRel = `thumbnails/page-${padded}.png`;
      const previewRel = `previews/page-${padded}.png`;
      const fullRel = `full/page-${padded}.png`;

      const thumbBuf = await renderPageToBuffer(page, thumbnailWidth);
      await uploader.upload(`${storagePrefix}/${thumbRel}`, thumbBuf, 'image/png');

      const previewBuf = await renderPageToBuffer(page, previewWidth);
      await uploader.upload(`${storagePrefix}/${previewRel}`, previewBuf, 'image/png');

      const fullBuf = await renderPageToBuffer(page, fullWidth);
      await uploader.upload(`${storagePrefix}/${fullRel}`, fullBuf, 'image/png');

      results.push({
        pageNumber: i,
        width: originalWidth,
        height: originalHeight,
        thumbnailPath: `${storagePrefix}/${thumbRel}`,
        previewPath: `${storagePrefix}/${previewRel}`,
        fullPath: `${storagePrefix}/${fullRel}`,
      });

      console.log(`[pdf-renderer] Page ${i}/${pdf.numPages} rendered and uploaded`);
    }

    return results;
  } catch (err) {
    throw new Error(`PDF rendering failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function renderPageToBuffer(page: any, targetWidth: number): Promise<Buffer> {
  const viewport = page.getViewport({ scale: 1 });
  const scale = targetWidth / viewport.width;
  const scaledViewport = page.getViewport({ scale });
  const canvas = createCanvas(scaledViewport.width, scaledViewport.height);
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
  await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
  return canvas.toBuffer('image/png');
}

export async function extractPageRegion(
  pageImageBuffer: Buffer,
  boundingBox: { x: number; y: number; width: number; height: number },
  originalWidth: number,
  originalHeight: number,
): Promise<Buffer> {
  const { loadImage } = require('canvas') as { loadImage: (b: Buffer) => unknown };
  const img = await loadImage(pageImageBuffer) as unknown as { width: number; height: number };

  const imgScale = img.width / originalWidth;
  const cropX = Math.round(boundingBox.x * originalWidth * imgScale);
  const cropY = Math.round(boundingBox.y * originalHeight * imgScale);
  const cropW = Math.round(boundingBox.width * originalWidth * imgScale);
  const cropH = Math.round(boundingBox.height * originalHeight * imgScale);

  const canvas = createCanvas(cropW, cropH);
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx.drawImage(img as any, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  return canvas.toBuffer('image/png');
}

function createCanvas(width: number, height: number): CanvasLike {
  const { createCanvas } = require('canvas') as { createCanvas: (w: number, h: number) => CanvasLike };
  return createCanvas(width, height);
}

interface CanvasLike {
  getContext(type: string): CanvasContextLike;
  toBuffer(format: string): Buffer;
}

interface CanvasContextLike {
  fillRect(x: number, y: number, w: number, h: number): void;
  fillText(text: string, x: number, y: number): void;
  measureText(text: string): { width: number };
  save(): void;
  restore(): void;
  scale(x: number, y: number): void;
  translate(x: number, y: number): void;
  drawImage(...args: unknown[]): void;
  fillStyle: string | unknown;
  font: string;
  textAlign: string;
  imageSmoothingEnabled: boolean;
}


