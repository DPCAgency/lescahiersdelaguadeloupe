export interface AnalysisInput {
  jobId: string;
  sourceType: 'pdf' | 'images';
  pageCount: number;
  metadata?: Record<string, unknown>;
}

export interface ExtractedBlockData {
  page_number: number;
  type: string;
  source_text: string;
  bounding_box_json: { x: number; y: number; width: number; height: number } | null;
  confidence: number;
  asset_path?: string;
}

export interface AnalysisResult {
  blocks: ExtractedBlockData[];
  pageCount: number;
  potentialArticles: PotentialArticle[];
}

export interface PotentialArticle {
  title: string;
  pageRange: string;
  blockIndices: number[];
  proposedFormat: string;
  proposedCategory: string;
  proposedHeroImage?: string;
}

export interface DocumentAnalysisProvider {
  analyze(input: AnalysisInput): Promise<AnalysisResult>;
}
