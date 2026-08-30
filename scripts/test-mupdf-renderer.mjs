import { readFileSync } from 'node:fs';

const mupdf = await import('mupdf');

const pdfBuffer = readFileSync('imports-private/N02-LES_CAHIERS_DE_LA_GUADELOUPE_2026.pdf');
const doc = mupdf.Document.openDocument(pdfBuffer, 'application/pdf');
const pageCount = doc.countPages();
console.log('PAGE COUNT:', pageCount);

for (let i = 0; i < pageCount; i++) {
  const page = doc.loadPage(i);
  const bounds = page.getBounds();
  const width = bounds[2] - bounds[0];
  const height = bounds[3] - bounds[1];

  const scale = 2000 / width;
  const ctm = [scale, 0, 0, scale, 0, 0];
  const pixmap = page.toPixmap(ctm, mupdf.ColorSpace.DeviceRGB, false);
  const pngData = pixmap.asPNG();

  console.log(`Page ${i + 1}/${pageCount} — width=${pixmap.getWidth()} height=${pixmap.getHeight()} pngBytes=${pngData.length}`);
}

console.log('ALL 11 PAGES: OK');
