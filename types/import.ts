export type {
  ImportStatus,
  ExtractedBlockType,
  ExtractedBlockStatus,
  AiSuggestionStatus,
} from './database';

export interface ImportJobWithBlocks {
  id: string;
  created_by: string | null;
  source_file_path: string;
  source_type: string;
  status: string;
  page_count: number | null;
  progress: number;
  error_message: string | null;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
  completed_at: string | null;
  blocks?: ExtractedBlockRow[];
}

export interface ExtractedBlockRow {
  id: string;
  import_job_id: string;
  page_number: number;
  type: string;
  source_text: string | null;
  edited_text: string | null;
  bounding_box_json: Record<string, unknown> | null;
  confidence: number;
  asset_path: string | null;
  status: string;
}

export interface AiSuggestionRow {
  id: string;
  import_job_id: string;
  suggestion_type: string;
  source_reference: string | null;
  suggestion_json: Record<string, unknown> | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}
