import { readFileSync, writeFileSync } from 'node:fs';

const blocks = JSON.parse(readFileSync('/tmp/blocks-result.json', 'utf-8'));
const JOB_ID = 'a0000000-0000-4000-8000-000000000001';

const values = blocks.map(b => {
  const text = b.source_text.replace(/'/g, "''").replace(/\n/g, '\\n');
  const bbox = b.bounding_box_json 
    ? `'${JSON.stringify(b.bounding_box_json).replace(/'/g, "''")}'::jsonb` 
    : 'NULL';
  return `('${JOB_ID}', ${b.page_number}, '${b.type}', '${text}', ${bbox}, ${b.confidence}, 'pending')`;
});

const sql = `INSERT INTO extracted_blocks (import_job_id, page_number, type, source_text, bounding_box_json, confidence, status) VALUES\n${values.join(',\n')};`;
writeFileSync('/tmp/blocks-insert-safe.sql', sql);
console.log('SQL written, length:', sql.length);
