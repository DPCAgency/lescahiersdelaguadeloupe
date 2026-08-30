export type {
  IssueStatus,
  OcrStatus,
  AssetType,
} from './database';

export interface IssueWithPages {
  id: string;
  issue_number: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  publication_date: string;
  cover_image_path: string | null;
  page_count: number;
  status: string;
  price_per_page: number;
  full_download_price: number;
  pdf_file_path: string | null;
  epub_file_path: string | null;
  subscriptions_allowed: boolean;
  pages?: IssuePageRow[];
}

export interface IssuePageRow {
  id: string;
  issue_id: string;
  page_number: number;
  position: number;
  title: string | null;
  preview_image_path: string | null;
  full_image_path: string | null;
  is_free: boolean;
  individual_price: number | null;
  ocr_status: string;
}
