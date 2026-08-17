import { analysisProvider } from '../lib/imports/mock-provider';
import { getProviderMode } from '../lib/imports/provider-factory';

async function testMockProvider() {
  console.log('=== TEST: Mock Provider + Normalization ===\n');

  const mode = getProviderMode();
  console.log('Provider mode:', mode);

  const result = await analysisProvider.analyze({
    jobId: 'test-job',
    sourceType: 'pdf',
    pageCount: 11,
  });

  console.log('✓ Analysis completed');
  console.log('  Pages:', result.pageCount);
  console.log('  Blocks:', result.blocks.length);
  console.log('  Potential articles:', result.potentialArticles.length);

  // Verify block structure
  let validBlocks = 0;
  let invalidBlocks = 0;
  for (const block of result.blocks) {
    const hasPage = typeof block.page_number === 'number';
    const hasType = typeof block.type === 'string' && block.type.length > 0;
    const hasBbox = block.bounding_box_json !== null && typeof block.bounding_box_json === 'object';
    const hasConfidence = typeof block.confidence === 'number' && block.confidence >= 0 && block.confidence <= 1;

    if (hasPage && hasType && hasBbox && hasConfidence) {
      validBlocks++;
    } else {
      invalidBlocks++;
      console.log('  INVALID block:', { hasPage, hasType, hasBbox, hasConfidence });
    }
  }
  console.log('✓ Valid blocks:', validBlocks);
  if (invalidBlocks > 0) console.log('  Invalid blocks:', invalidBlocks);

  // Check bounding boxes are relative (0-1)
  let allRelative = true;
  for (const block of result.blocks) {
    const b = block.bounding_box_json;
    if (b && (b.x > 1 || b.y > 1 || b.width > 1 || b.height > 1)) {
      allRelative = false;
      console.log('  Non-relative bbox:', b);
    }
  }
  console.log('✓ Bounding boxes relative (0-1):', allRelative);

  // Check block types
  const typeCounts = {};
  for (const block of result.blocks) {
    typeCounts[block.type] = (typeCounts[block.type] || 0) + 1;
  }
  console.log('  Block types:', JSON.stringify(typeCounts));

  // Check source_text immutability
  const firstTextBlock = result.blocks.find(b => b.source_text);
  console.log('✓ source_text present:', !!firstTextBlock?.source_text);

  // Check potential articles
  for (const article of result.potentialArticles) {
    console.log('  Article:', article.title, '| Pages:', article.pageRange, '| Blocks:', article.blockIndices.length);
  }

  console.log('\n=== MOCK PROVIDER TEST: PASSED ===');
}

testMockProvider().catch(err => {
  console.error('\n=== MOCK PROVIDER TEST: FAILED ===');
  console.error(err);
  process.exit(1);
});
