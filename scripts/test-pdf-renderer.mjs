import { readFileSync } from 'node:fs';

const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

console.log('[PDFJS MODULE]', {
  version: pdfjs.version,
  getDocument: typeof pdfjs.getDocument,
  hasDefault: !!pdfjs.default,
  defaultGetDocument: typeof pdfjs.default?.getDocument,
  keys: Object.keys(pdfjs).slice(0, 15),
});

if (typeof pdfjs.getDocument !== 'function') {
  console.error('FAIL: getDocument is not a function');
  process.exit(1);
}

const pdfBuffer = readFileSync('imports-private/N02-LES_CAHIERS_DE_LA_GUADELOUPE_2026.pdf');
const loadingTask = pdfjs.getDocument({
  data: new Uint8Array(pdfBuffer),
  useSystemFonts: false,
  useWorkerFetch: false,
  isEvalSupported: false,
});

const pdf = await loadingTask.promise;
console.log('PDF LOAD: OK');
console.log('PAGE COUNT:', pdf.numPages);

const page = await pdf.getPage(1);
console.log('PAGE 1 LOAD: OK');

const viewport = page.getViewport({ scale: 1 });
console.log('PAGE 1 WIDTH:', viewport.width);
console.log('PAGE 1 HEIGHT:', viewport.height);

const { createCanvas } = await import('canvas');
const scale = 400 / viewport.width;
const scaledViewport = page.getViewport({ scale });
const canvas = createCanvas(scaledViewport.width, scaledViewport.height);
const ctx = canvas.getContext('2d');
await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
const buf = canvas.toBuffer('image/png');
console.log('PAGE 1 RENDER: OK');
console.log('PNG BYTES:', buf.length);
