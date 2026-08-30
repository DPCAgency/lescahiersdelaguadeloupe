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
    const mupdf = await import('mupdf');
    const pdfBuffer = Buffer.from(arrayBuffer);
    const doc = mupdf.Document.openDocument(pdfBuffer, 'application/pdf');
    const pageCount = doc.countPages();

    console.log(`[pdf-renderer] MuPDF opened · pages=${pageCount}`);

    const results: RenderedPage[] = [];

    for (let i = 0; i < pageCount; i++) {
      const page = doc.loadPage(i);
      const bounds = page.getBounds();
      const originalWidth = bounds[2] - bounds[0];
      const originalHeight = bounds[3] - bounds[1];

      const padded = String(i + 1).padStart(2, '0');
      const thumbRel = `thumbnails/page-${padded}.png`;
      const previewRel = `previews/page-${padded}.png`;
      const fullRel = `full/page-${padded}.png`;

      const thumbBuf = renderPageToBuffer(page, thumbnailWidth, mupdf);
      await uploader.upload(`${storagePrefix}/${thumbRel}`, thumbBuf, 'image/png');

      const previewBuf = renderPageToBuffer(page, previewWidth, mupdf);
      await uploader.upload(`${storagePrefix}/${previewRel}`, previewBuf, 'image/png');

      const fullBuf = renderPageToBuffer(page, fullWidth, mupdf);
      await uploader.upload(`${storagePrefix}/${fullRel}`, fullBuf, 'image/png');

      results.push({
        pageNumber: i + 1,
        width: originalWidth,
        height: originalHeight,
        thumbnailPath: `${storagePrefix}/${thumbRel}`,
        previewPath: `${storagePrefix}/${previewRel}`,
        fullPath: `${storagePrefix}/${fullRel}`,
      });

      console.log(`[pdf-renderer] Page ${i + 1}/${pageCount} rendered and uploaded`);
    }

    return results;
  } catch (err) {
    throw new Error(`PDF rendering failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

export async function extractPageRegion(
  pageImageBuffer: Buffer,
  boundingBox: { x: number; y: number; width: number; height: number },
  originalWidth: number,
  originalHeight: number,
): Promise<Buffer> {
  const { loadImage, createCanvas } = require('canvas') as {
    loadImage: (b: Buffer) => unknown;
    createCanvas: (w: number, h: number) => CanvasLike;
  };
  const img = await loadImage(pageImageBuffer) as unknown as { width: number; height: number };

  const imgScale = img.width / originalWidth;
  const cropX = Math.round(boundingBox.x * originalWidth * imgScale);
  const cropY = Math.round(boundingBox.y * originalHeight * imgScale);
  const cropW = Math.round(boundingBox.width * originalWidth * imgScale);
  const cropH = Math.round(boundingBox.height * originalHeight * imgScale);

  const canvas = createCanvas(cropW, cropH);
  const ctx = canvas.getContext('2d');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx.drawImage(img as any, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  return canvas.toBuffer('image/png');
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
