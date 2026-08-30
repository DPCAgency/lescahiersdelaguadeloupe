import type { DocumentAnalysisProvider, AnalysisInput, AnalysisResult, ExtractedBlockData, PotentialArticle } from './types';

const n02Blocks: ExtractedBlockData[] = [
  { page_number: 1, type: 'heading', source_text: `Qui gouverne réellement Le Gosier ?`, bounding_box_json: { x: 0.10, y: 0.09, width: 0.83, height: 0.07 }, confidence: 0.98 },
  { page_number: 1, type: 'subheading', source_text: `Enquête sur la gouvernance locale`, bounding_box_json: { x: 0.10, y: 0.17, width: 0.67, height: 0.03 }, confidence: 0.95 },
  { page_number: 1, type: 'image', source_text: '', bounding_box_json: { x: 0.10, y: 0.22, width: 0.83, height: 0.67 }, confidence: 0.92, asset_path: 'covers/numero-02-cover.jpg' },
  { page_number: 1, type: 'footer', source_text: `Les Cahiers de la Guadeloupe — N°02 — Août 2026`, bounding_box_json: { x: 0.10, y: 0.91, width: 0.83, height: 0.02 }, confidence: 0.97 },

  { page_number: 2, type: 'heading', source_text: `Une question de gouvernance`, bounding_box_json: { x: 0.10, y: 0.07, width: 0.83, height: 0.06 }, confidence: 0.96 },
  { page_number: 2, type: 'paragraph', source_text: `Les différentes fonctions, relations et intérêts sont-ils demeurés suffisamment séparés pour garantir l'impartialité de la décision publique ?`, bounding_box_json: { x: 0.10, y: 0.15, width: 0.83, height: 0.09 }, confidence: 0.91 },
  { page_number: 2, type: 'paragraph', source_text: `Cette enquête cherche à comprendre comment se construit réellement la décision publique et où se situent les différents centres d'influence.`, bounding_box_json: { x: 0.10, y: 0.25, width: 0.83, height: 0.07 }, confidence: 0.88 },
  { page_number: 2, type: 'quote', source_text: `La transparence n'est pas un accessoire. Elle constitue une condition de la confiance publique.`, bounding_box_json: { x: 0.13, y: 0.36, width: 0.77, height: 0.06 }, confidence: 0.84 },
  { page_number: 2, type: 'sidebar', source_text: `Méthode : examen des documents publics, délibérations, témoignages recueillis auprès d'élus, d'agents et d'acteurs locaux.`, bounding_box_json: { x: 0.10, y: 0.44, width: 0.83, height: 0.09 }, confidence: 0.79 },

  { page_number: 3, type: 'heading', source_text: `Le Gosier : un territoire aux enjeux économiques importants`, bounding_box_json: { x: 0.10, y: 0.07, width: 0.83, height: 0.06 }, confidence: 0.94 },
  { page_number: 3, type: 'paragraph', source_text: `Tourisme, économie nocturne, autorisations et décisions publiques : le Gosier combine des enjeux économiques importants avec une activité municipale dense.`, bounding_box_json: { x: 0.10, y: 0.15, width: 0.83, height: 0.09 }, confidence: 0.86 },
  { page_number: 3, type: 'key_figure', source_text: `67 soirées concernées`, bounding_box_json: { x: 0.10, y: 0.26, width: 0.33, height: 0.04 }, confidence: 0.89 },
  { page_number: 3, type: 'key_figure', source_text: `46 370,10 € montant étudié`, bounding_box_json: { x: 0.47, y: 0.26, width: 0.47, height: 0.04 }, confidence: 0.87 },

  { page_number: 4, type: 'heading', source_text: `Les gouvernances municipales depuis 2021`, bounding_box_json: { x: 0.10, y: 0.07, width: 0.83, height: 0.06 }, confidence: 0.93 },
  { page_number: 4, type: 'timeline', source_text: `2020 — Changement de gouvernance municipale`, bounding_box_json: { x: 0.10, y: 0.15, width: 0.83, height: 0.03 }, confidence: 0.85 },
  { page_number: 4, type: 'timeline', source_text: `2021 — Délibérations sur les subventions`, bounding_box_json: { x: 0.10, y: 0.19, width: 0.83, height: 0.03 }, confidence: 0.83 },
  { page_number: 4, type: 'timeline', source_text: `2022 — Saisine et recours`, bounding_box_json: { x: 0.10, y: 0.23, width: 0.83, height: 0.03 }, confidence: 0.81 },
  { page_number: 4, type: 'timeline', source_text: `2023 — Témoignages recueillis`, bounding_box_json: { x: 0.10, y: 0.27, width: 0.83, height: 0.03 }, confidence: 0.80 },

  { page_number: 5, type: 'heading', source_text: `Regarder la mécanique`, bounding_box_json: { x: 0.10, y: 0.07, width: 0.83, height: 0.06 }, confidence: 0.92 },
  { page_number: 5, type: 'paragraph', source_text: `Comment se construit la décision publique. Le rôle du maire, du conseil municipal, du cabinet et de l'administration.`, bounding_box_json: { x: 0.10, y: 0.15, width: 0.83, height: 0.09 }, confidence: 0.87 },
  { page_number: 5, type: 'paragraph', source_text: `Le maire dispose de l'autorité de police, de l'exécutif local et de la signature des actes.`, bounding_box_json: { x: 0.10, y: 0.25, width: 0.83, height: 0.07 }, confidence: 0.85 },

  { page_number: 6, type: 'heading', source_text: `Directeur de cabinet et entrepreneur`, bounding_box_json: { x: 0.10, y: 0.07, width: 0.83, height: 0.06 }, confidence: 0.91 },
  { page_number: 6, type: 'paragraph', source_text: `Analyse des fonctions publiques et intérêts privés. Où se situe la frontière entre mandat politique et activité professionnelle ?`, bounding_box_json: { x: 0.10, y: 0.15, width: 0.83, height: 0.09 }, confidence: 0.84 },
  { page_number: 6, type: 'sidebar', source_text: `Le code général des collectivités territoriales encadre les cumuls de mandats et d'activités.`, bounding_box_json: { x: 0.10, y: 0.26, width: 0.83, height: 0.07 }, confidence: 0.76 },

  { page_number: 7, type: 'heading', source_text: `De la campagne à la subvention`, bounding_box_json: { x: 0.10, y: 0.07, width: 0.83, height: 0.06 }, confidence: 0.90 },
  { page_number: 7, type: 'paragraph', source_text: `46 370,10 € qui interrogent. Du financement d'une campagne à l'attribution d'une subvention publique.`, bounding_box_json: { x: 0.10, y: 0.15, width: 0.83, height: 0.09 }, confidence: 0.83 },
  { page_number: 7, type: 'key_figure', source_text: `46 370,10 €`, bounding_box_json: { x: 0.10, y: 0.26, width: 0.33, height: 0.04 }, confidence: 0.88 },

  { page_number: 8, type: 'heading', source_text: `De l'argent politique à l'argent public`, bounding_box_json: { x: 0.10, y: 0.07, width: 0.83, height: 0.06 }, confidence: 0.89 },
  { page_number: 8, type: 'paragraph', source_text: `Le passage du financement électoral aux subventions municipales pose la question des liens entre campagne et gouvernance.`, bounding_box_json: { x: 0.10, y: 0.15, width: 0.83, height: 0.09 }, confidence: 0.82 },

  { page_number: 9, type: 'heading', source_text: `Laupen–Simonnot`, bounding_box_json: { x: 0.10, y: 0.07, width: 0.83, height: 0.06 }, confidence: 0.78 },
  { page_number: 9, type: 'paragraph', source_text: `Analyse d'un cas pratique illustrant les questions de gouvernance et de conflits d'intérêts potentiels.`, bounding_box_json: { x: 0.10, y: 0.15, width: 0.83, height: 0.09 }, confidence: 0.71 },

  { page_number: 10, type: 'heading', source_text: `Une question centrale`, bounding_box_json: { x: 0.10, y: 0.07, width: 0.83, height: 0.06 }, confidence: 0.93 },
  { page_number: 10, type: 'paragraph', source_text: `Les différentes fonctions, relations et intérêts sont-ils demeurés suffisamment séparés pour garantir l'impartialité de la décision publique ?`, bounding_box_json: { x: 0.10, y: 0.15, width: 0.83, height: 0.09 }, confidence: 0.86 },
  { page_number: 10, type: 'quote', source_text: `La question centrale reste ouverte.`, bounding_box_json: { x: 0.13, y: 0.26, width: 0.77, height: 0.04 }, confidence: 0.81 },

  { page_number: 11, type: 'heading', source_text: `Conclusion`, bounding_box_json: { x: 0.10, y: 0.07, width: 0.83, height: 0.06 }, confidence: 0.94 },
  { page_number: 11, type: 'paragraph', source_text: `Ce cahier ne désigne pas de coupables. Il pose une question : qui exerce réellement l'influence dans la fabrication de la décision publique au Gosier ?`, bounding_box_json: { x: 0.10, y: 0.15, width: 0.83, height: 0.09 }, confidence: 0.88 },
  { page_number: 11, type: 'footer', source_text: `Les Cahiers de la Guadeloupe — N°02 — Août 2026`, bounding_box_json: { x: 0.10, y: 0.91, width: 0.83, height: 0.02 }, confidence: 0.96 },
];

const n02PotentialArticles: PotentialArticle[] = [
  { title: `Qui gouverne réellement Le Gosier ?`, pageRange: `1–2`, blockIndices: [0, 1, 2, 3, 4, 5, 6, 7], proposedFormat: 'enquete', proposedCategory: 'politique-institutions', proposedHeroImage: 'covers/numero-02-cover.jpg' },
  { title: `Le Gosier : un territoire aux enjeux économiques importants`, pageRange: `3–4`, blockIndices: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17], proposedFormat: 'analyse', proposedCategory: 'economie' },
  { title: `Regarder la mécanique`, pageRange: `5`, blockIndices: [18, 19, 20], proposedFormat: 'decryptage', proposedCategory: 'politique-institutions' },
  { title: `Directeur de cabinet et entrepreneur`, pageRange: `6–7`, blockIndices: [21, 22, 23, 24, 25, 26], proposedFormat: 'enquete', proposedCategory: 'politique-institutions' },
  { title: `De l'argent politique à l'argent public`, pageRange: `8–9`, blockIndices: [27, 28, 29, 30], proposedFormat: 'analyse', proposedCategory: 'economie' },
  { title: `Conclusion : qui gouverne réellement Le Gosier ?`, pageRange: `10–11`, blockIndices: [31, 32, 33, 34, 35], proposedFormat: 'tribune', proposedCategory: 'politique-institutions' },
];

export class MockDocumentAnalysisProvider implements DocumentAnalysisProvider {
  async analyze(input: AnalysisInput): Promise<AnalysisResult> {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (input.sourceType === 'pdf' && input.pageCount >= 10) {
      return {
        blocks: n02Blocks,
        pageCount: 11,
        potentialArticles: n02PotentialArticles,
      };
    }

    const blocks: ExtractedBlockData[] = [];
    for (let p = 1; p <= input.pageCount; p++) {
      blocks.push({
        page_number: p,
        type: p === 1 ? 'heading' : 'paragraph',
        source_text: p === 1 ? `Titre détecté (simulé)` : `Texte de la page ${p} (simulé)`,
        bounding_box_json: { x: 0.10, y: 0.07, width: 0.83, height: 0.09 },
        confidence: 0.75 + (p % 3) * 0.07,
      });
    }

    return {
      blocks,
      pageCount: input.pageCount,
      potentialArticles: [
        { title: `Article simulé`, pageRange: `1–${input.pageCount}`, blockIndices: blocks.map((_, i) => i), proposedFormat: 'analyse', proposedCategory: 'politique-institutions' },
      ],
    };
  }
}

export const analysisProvider: DocumentAnalysisProvider = new MockDocumentAnalysisProvider();
