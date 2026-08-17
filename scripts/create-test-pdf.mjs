import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { writeFileSync } from 'fs';

async function createTestPdf() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const titles = [
    'Qui gouverne reellement Le Gosier ?',
    'Une question de gouvernance',
    'Le Gosier : un territoire aux enjeux',
    'Les gouvernances municipales depuis 2021',
    'Regarder la mecanique',
    'Directeur de cabinet et entrepreneur',
    'De la campagne a la subvention',
    'De l argent politique a l argent public',
    'Laupen-Simonnot',
    'Une question centrale',
    'Conclusion',
  ];

  const bodies = [
    'Enquete sur la gouvernance locale du Gosier. Ce cahier ne designe pas de coupables. Il pose une question.',
    'Les differentes fonctions, relations et interets sont-ils demeures suffisamment separes pour garantir l impartialite ?',
    'Tourisme, economie nocturne, autorisations et decisions publiques : le Gosier combine des enjeux economiques importants.',
    'Chronologie des changements politiques depuis 2020. Deliberations, saisines et recours.',
    'Comment se construit la decision publique. Le role du maire, du conseil municipal, du cabinet.',
    'Analyse des fonctions publiques et interets prives. Ou se situe la frontiere ?',
    '46 370,10 euros qui interrogent. Du financement d une campagne a l attribution d une subvention.',
    'Le passage du financement electoral aux subventions municipales pose la question des liens.',
    'Analyse d un cas pratique illustrant les questions de gouvernance et de conflits d interets.',
    'Les differentes fonctions, relations et interets sont-ils demeures suffisamment separes ?',
    'Ce cahier ne designe pas de coupables. Il pose une question : qui exerce reellement l influence ?',
  ];

  for (let i = 0; i < 11; i++) {
    const page = pdfDoc.addPage([595, 842]);
    const y = 780;

    page.drawText(titles[i], { x: 50, y, size: 18, font: fontBold, color: rgb(0, 0, 0) });
    page.drawText(`Page ${i + 1} sur 11`, { x: 50, y: 750, size: 10, font, color: rgb(0.3, 0.3, 0.3) });

    // Body text (wrapped manually)
    const words = bodies[i].split(' ');
    let line = '';
    let lineY = 700;
    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      if (testLine.length > 65) {
        page.drawText(line, { x: 50, y: lineY, size: 12, font, color: rgb(0.1, 0.1, 0.1) });
        line = word;
        lineY -= 18;
      } else {
        line = testLine;
      }
    }
    if (line) {
      page.drawText(line, { x: 50, y: lineY, size: 12, font, color: rgb(0.1, 0.1, 0.1) });
    }

    // Footer
    page.drawText('Les Cahiers de la Guadeloupe - N02 - Aout 2026', {
      x: 50, y: 30, size: 8, font, color: rgb(0.4, 0.4, 0.4),
    });
  }

  const pdfBytes = await pdfDoc.save();
  writeFileSync('./tmp-test-cahier.pdf', pdfBytes);
  console.log('✓ Test PDF created:', (pdfBytes.length / 1024).toFixed(1), 'KB');
  console.log('  Pages: 11');
}

createTestPdf();
