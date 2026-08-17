import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const envText = readFileSync('.env', 'utf-8');
const env = {};
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const JOB_ID = 'test-openai-' + Date.now();
console.log('JOB_ID:', JOB_ID);

// 1. Create a test import job
const { data: jobData, error: jobErr } = await supabase.from('import_jobs').insert({
  id: JOB_ID,
  source_file_path: 'test-openai/original.pdf',
  source_type: 'pdf',
  status: 'processing',
  metadata_json: { test: true, original_filename: 'test-openai-page1.mjs' },
}).select().single();

if (jobErr) {
  console.error('Failed to create job:', jobErr.message);
  process.exit(1);
}
console.log('Job created:', JOB_ID);

// 2. Render all 11 pages
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

// 3. Analyze each page with OpenAI
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

// 4. Type counts
const typeCounts = {};
for (const b of allBlocks) {
  typeCounts[b.type] = (typeCounts[b.type] || 0) + 1;
}
console.log('TYPE COUNTS:', JSON.stringify(typeCounts));

const lowConf = allBlocks.filter(b => b.confidence < 0.7).length;
console.log('LOW CONFIDENCE:', lowConf);

// 5. Insert blocks into extracted_blocks
const blockInserts = allBlocks.map(b => ({
  import_job_id: JOB_ID,
  page_number: b.page_number,
  type: b.type,
  source_text: b.source_text,
  bounding_box_json: b.bounding_box_json,
  confidence: b.confidence,
  status: 'pending',
}));

const { error: blockErr } = await supabase.rpc('insert_extracted_blocks_batch', {
  p_job_id: JOB_ID,
  p_blocks: blockInserts,
});

if (blockErr) {
  console.error('Block insert failed:', blockErr.message);
  // Try direct insert
  const { error: directErr } = await supabase.from('extracted_blocks').insert(blockInserts);
  if (directErr) {
    console.error('Direct insert also failed:', directErr.message);
  } else {
    console.log('Blocks inserted via direct insert');
  }
} else {
  console.log('Blocks inserted via RPC');
}

// 6. Verify in DB
const { data: dbBlocks, error: dbErr } = await supabase
  .from('extracted_blocks')
  .select('id, page_number, type, confidence')
  .eq('import_job_id', JOB_ID);

if (dbErr) {
  console.error('DB verification failed:', dbErr.message);
} else {
  console.log('DB BLOCKS:', dbBlocks.length);
  const byPage = {};
  for (const b of dbBlocks) {
    byPage[b.page_number] = (byPage[b.page_number] || 0) + 1;
  }
  console.log('BLOCKS BY PAGE:', JSON.stringify(byPage));
}

// 7. Update job status
await supabase.from('import_jobs').update({
  status: 'needs_review',
  progress: 100,
  page_count: pdf.numPages,
  completed_at: new Date().toISOString(),
}).eq('id', JOB_ID);

console.log('JOB STATUS: needs_review');
console.log('DONE');
