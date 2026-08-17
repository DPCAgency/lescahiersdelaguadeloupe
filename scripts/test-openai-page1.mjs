import { readFileSync } from 'node:fs';

const pdfBuffer = readFileSync('imports-private/N02-LES_CAHIERS_DE_LA_GUADELOUPE_2026.pdf');
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

const loadingTask = pdfjs.getDocument({
  data: new Uint8Array(pdfBuffer),
  useSystemFonts: false,
  useWorkerFetch: false,
  isEvalSupported: false,
});
const pdf = await loadingTask.promise;
const page = await pdf.getPage(1);
const viewport = page.getViewport({ scale: 1 });

const { createCanvas } = await import('canvas');
const scale = 2000 / viewport.width;
const scaledViewport = page.getViewport({ scale });
const canvas = createCanvas(scaledViewport.width, scaledViewport.height);
const ctx = canvas.getContext('2d');
await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
const buf = canvas.toBuffer('image/png');
console.log('PAGE 1 RENDER: OK, bytes:', buf.length);

const base64 = buf.toString('base64');
console.log('BASE64 length:', base64.length);

const envVars = {};
const envText = readFileSync('.env', 'utf-8');
for (const line of envText.split('\n')) {
  const m = line.match(/^(SUPABASE_URL|SUPABASE_ANON_KEY)=(.*)$/);
  if (m) envVars[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const start = Date.now();
const resp = await fetch(`${envVars.SUPABASE_URL}/functions/v1/openai-vision`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${envVars.SUPABASE_ANON_KEY}`,
  },
  body: JSON.stringify({ imageBase64: base64, pageNumber: 1 }),
});

console.log('HTTP STATUS:', resp.status);
const data = await resp.json();
const duration = Date.now() - start;
console.log('DURATION:', duration, 'ms');

if (!resp.ok) {
  console.error('ERROR:', JSON.stringify(data).slice(0, 500));
  process.exit(1);
}

const blocks = data.blocks || [];
console.log('BLOCKS RAW:', blocks.length);

const typeCounts = {};
for (const b of blocks) {
  const t = b.type || 'unknown';
  typeCounts[t] = (typeCounts[t] || 0) + 1;
}
console.log('TYPE COUNTS:', JSON.stringify(typeCounts));

const lowConf = blocks.filter(b => (b.confidence ?? 0) < 0.7).length;
console.log('LOW CONFIDENCE:', lowConf);

console.log('---BLOCKS---');
for (const b of blocks) {
  console.log(`  [${b.type}] conf=${b.confidence} text="${(b.source_text || '').slice(0, 80)}..."`);
}
