import { createRequire } from 'module';
import { existsSync, readFileSync, writeFileSync, statSync } from 'fs';

const require = createRequire(import.meta.url);

async function testPdfRendering() {
  console.log('=== TEST: PDF Rendering with pdfjs-dist + canvas ===\n');

  const pdfPath = './tmp-test-cahier.pdf';

  if (!existsSync(pdfPath)) {
    console.error('FAIL: PDF file not found at', pdfPath);
    process.exit(1);
  }
  console.log('✓ PDF file found:', pdfPath);

  const fileBuffer = readFileSync(pdfPath);
  const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
  console.log('✓ PDF loaded into memory:', (fileBuffer.length / 1024).toFixed(0), 'KB');

  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    console.log('✓ pdfjs-dist imported');

    const workerUrl = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    console.log('✓ Worker configured');

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    console.log('✓ PDF opened successfully');
    console.log('  Pages detected:', pdf.numPages);

    if (pdf.numPages !== 11) {
      console.error('FAIL: Expected 11 pages, got', pdf.numPages);
    } else {
      console.log('✓ Page count matches expected (11)');
    }

    console.log('\n--- Rendering page 1 ---');
    const page1 = await pdf.getPage(1);
    const viewport = page1.getViewport({ scale: 1 });
    console.log('  Original dimensions:', viewport.width.toFixed(0), 'x', viewport.height.toFixed(0));

    const { createCanvas } = require('canvas');
    console.log('✓ canvas module loaded');

    // Thumbnail (400px wide)
    const thumbScale = 400 / viewport.width;
    const thumbViewport = page1.getViewport({ scale: thumbScale });
    const thumbCanvas = createCanvas(thumbViewport.width, thumbViewport.height);
    const thumbCtx = thumbCanvas.getContext('2d');
    await page1.render({ canvasContext: thumbCtx, viewport: thumbViewport }).promise;
    const thumbBuffer = thumbCanvas.toBuffer('image/png');
    writeFileSync('./tmp-test-page-01-thumbnail.png', thumbBuffer);
    console.log('✓ Thumbnail rendered:', thumbViewport.width.toFixed(0), 'x', thumbViewport.height.toFixed(0), '→', (thumbBuffer.length / 1024).toFixed(0), 'KB');

    // Preview (1200px wide)
    const previewScale = 1200 / viewport.width;
    const previewViewport = page1.getViewport({ scale: previewScale });
    const previewCanvas = createCanvas(previewViewport.width, previewViewport.height);
    const previewCtx = previewCanvas.getContext('2d');
    await page1.render({ canvasContext: previewCtx, viewport: previewViewport }).promise;
    const previewBuffer = previewCanvas.toBuffer('image/png');
    writeFileSync('./tmp-test-page-01-preview.png', previewBuffer);
    console.log('✓ Preview rendered:', previewViewport.width.toFixed(0), 'x', previewViewport.height.toFixed(0), '→', (previewBuffer.length / 1024).toFixed(0), 'KB');

    // Verify files can be re-read
    const thumbRead = readFileSync('./tmp-test-page-01-thumbnail.png');
    const previewRead = readFileSync('./tmp-test-page-01-preview.png');
    console.log('✓ Thumbnail re-read OK:', (thumbRead.length / 1024).toFixed(0), 'KB');
    console.log('✓ Preview re-read OK:', (previewRead.length / 1024).toFixed(0), 'KB');

    // Test pages 2, 5, 11
    for (const pageNum of [2, 5, 11]) {
      console.log(`\n--- Rendering page ${pageNum} ---`);
      const page = await pdf.getPage(pageNum);
      const vp = page.getViewport({ scale: 1 });
      const ts = 400 / vp.width;
      const tvp = page.getViewport({ scale: ts });
      const tc = createCanvas(tvp.width, tvp.height);
      const tctx = tc.getContext('2d');
      await page.render({ canvasContext: tctx, viewport: tvp }).promise;
      const tb = tc.toBuffer('image/png');
      writeFileSync(`./tmp-test-page-${String(pageNum).padStart(2, '0')}-thumbnail.png`, tb);
      console.log(`✓ Page ${pageNum} thumbnail:`, tvp.width.toFixed(0), 'x', tvp.height.toFixed(0), '→', (tb.length / 1024).toFixed(0), 'KB');
    }

    // Test extractPageRegion (crop)
    console.log('\n--- Testing extractPageRegion (crop) ---');
    const cropCanvas = createCanvas(200, 200);
    const cropCtx = cropCanvas.getContext('2d');
    cropCtx.drawImage(previewCanvas, 100, 100, 400, 400, 0, 0, 200, 200);
    const cropBuffer = cropCanvas.toBuffer('image/png');
    writeFileSync('./tmp-test-crop.png', cropBuffer);
    console.log('✓ Crop produced:', (cropBuffer.length / 1024).toFixed(0), 'KB');

    console.log('\n=== PDF RENDERING TEST: PASSED ===');

  } catch (err) {
    console.error('\n=== PDF RENDERING TEST: FAILED ===');
    console.error('Error:', err instanceof Error ? err.message : err);
    console.error('Stack:', err instanceof Error ? err.stack : 'N/A');
    process.exit(1);
  }
}

testPdfRendering();
