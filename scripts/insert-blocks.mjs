import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const envText = readFileSync('.env', 'utf-8');
const env = {};
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const blocks = JSON.parse(readFileSync('/tmp/blocks-result.json', 'utf-8'));
const JOB_ID = 'a0000000-0000-4000-8000-000000000001';

const blockInserts = blocks.map(b => ({
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
  console.error('RPC insert failed:', blockErr.message);
  // Try direct insert
  const { error: directErr } = await supabase.from('extracted_blocks').insert(blockInserts);
  if (directErr) {
    console.error('Direct insert also failed:', directErr.message);
    process.exit(1);
  } else {
    console.log('Blocks inserted via direct insert');
  }
} else {
  console.log('Blocks inserted via RPC');
}

// Verify
const { data: dbBlocks, error: dbErr } = await supabase
  .from('extracted_blocks')
  .select('id, page_number, type, confidence')
  .eq('import_job_id', JOB_ID);

if (dbErr) {
  console.error('DB verification failed:', dbErr.message);
  process.exit(1);
}

console.log('DB BLOCKS:', dbBlocks.length);
const byPage = {};
for (const b of dbBlocks) {
  byPage[b.page_number] = (byPage[b.page_number] || 0) + 1;
}
console.log('BLOCKS BY PAGE:', JSON.stringify(byPage));
console.log('DONE');
