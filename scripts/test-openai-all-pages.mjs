import { readFileSync } from 'node:fs';

const envText = readFileSync('.env', 'utf-8');
const env = {};
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const pdfBuffer = readFileSync('imports-private/N02-LES_CAHIERS_DE_LA_GUADELOUPE_2026.pdf');
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

const loadingTask = pdfjs.getDocument({
  data: new Uint8Array(pdfBuffer),
  useSystemFonts: false,
  useWorkerFetch: false,
  isEvalSupported: false,
});
const pdf = await loadingTask.promise;
console.log('PDF LOAD: OK, pages:', pdf.numPages);

const { createCanvas } = await import('canvas');

const allBlocks = [];
const errors = [];

for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
  const pageStart = Date.now();
  try {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const scale = 2000 / viewport.width;
    const scaledViewport = page.getViewport({ scale });
    const canvas = createCanvas(scaledViewport.width, scaledViewport.height);
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
    const buf = canvas.toBuffer('image/png');
    const base64 = buf.toString('base64');

    const resp = await fetch(`${env.SUPABASE_URL}/functions/v1/openai-vision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ imageBase64: base64, pageNumber: pageNum }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error(`Page ${pageNum}/${pdf.numPages} HTTP ${resp.status}: ${errText.slice(0, 200)}`);
      errors.push({ page: pageNum, status: resp.status, error: errText.slice(0, 200) });
      allBlocks.push({ page_number: pageNum, type: 'unknown', source_text: '', confidence: 0, bounding_box_json: null });
      continue;
    }

    const data = await resp.json();
    const blocks = data.blocks || [];
    const duration = Date.now() - pageStart;
    console.log(`Page ${pageNum}/${pdf.numPages} — blocks=${blocks.length} duration=${duration}ms`);

    for (const blk of blocks) {
      allBlocks.push({
        page_number: pageNum,
        type: blk.type || 'unknown',
        source_text: blk.source_text || '',
        confidence: typeof blk.confidence === 'number' ? blk.confidence : 0.5,
        bounding_box_json: blk.bounding_box || null,
      });
    }
  } catch (err) {
    console.error(`Page ${pageNum} failed: ${err.message}`);
    errors.push({ page: pageNum, error: err.message });
    allBlocks.push({ page_number: pageNum, type: 'unknown', source_text: '', confidence: 0, bounding_box_json: null });
  }
}

console.log('TOTAL BLOCKS:', allBlocks.length);
console.log('PAGES WITH ERRORS:', errors.length);

const typeCounts = {};
for (const b of allBlocks) {
  typeCounts[b.type] = (typeCounts[b.type] || 0) + 1;
}
console.log('TYPE COUNTS:', JSON.stringify(typeCounts));

const lowConf = allBlocks.filter(b => b.confidence < 0.7).length;
console.log('LOW CONFIDENCE:', lowConf);

// Output blocks as JSON for DB insertion
const fs = await import('node:fs');
fs.writeFileSync('/tmp/blocks-result.json', JSON.stringify(allBlocks));
console.log('Blocks saved to /tmp/blocks-result.json');
console.log('DONE');
