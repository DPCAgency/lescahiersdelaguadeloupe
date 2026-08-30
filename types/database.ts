/*
 * Auto-generated TypeScript types for the Supabase schema.
 * These types mirror the database tables created in migrations 0001–0006.
 * Update this file when migrations add or alter tables.
 */

export type UserRole = 'reader' | 'editor' | 'admin' | 'super_admin';
export type ArticleStatus = 'draft' | 'review' | 'scheduled' | 'published' | 'archived';
export type ArticleFormat = 'enquete' | 'analyse' | 'decryptage' | 'entretien' | 'chronologie' | 'tribune' | 'reportage' | 'dossier';
export type IssueStatus = 'draft' | 'published' | 'archived';
export type OcrStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ImportStatus = 'uploaded' | 'processing' | 'needs_review' | 'validated' | 'failed';
export type ExtractedBlockStatus = 'pending' | 'validated' | 'modified' | 'ignored';
export type AiSuggestionStatus = 'pending' | 'accepted' | 'rejected' | 'edited';
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
export type ProductType = 'issue_page' | 'issue_full' | 'pdf' | 'epub' | 'subscription';
export type ResourceType = 'issue' | 'issue_page';
export type SourceType = 'purchase' | 'gift' | 'admin' | 'promotion';
export type TerritoryType = 'commune' | 'archipel' | 'zone' | 'territoire';
export type AssetType = 'image' | 'illustration' | 'logo' | 'icon' | 'chart' | 'document' | 'other';
export type ExtractedBlockType = 'heading' | 'subheading' | 'paragraph' | 'image' | 'caption' | 'quote' | 'key_figure' | 'timeline' | 'sidebar' | 'footer' | 'unknown';
export type ArticleBlockType = 'paragraph' | 'heading' | 'image' | 'gallery' | 'quote' | 'key_figures' | 'timeline' | 'fact' | 'document' | 'testimony' | 'analysis' | 'open_question' | 'hypothesis' | 'sidebar' | 'video' | 'source' | 'issue_reference';
export type NavigationLocation = 'header' | 'footer' | 'secondary';
export type HomePageSectionType = 'hero' | 'who_decides' | 'editorial_intro' | 'dossier' | 'key_figures' | 'timeline' | 'central_question' | 'latest_investigations' | 'analysis' | 'territories' | 'latest_issue' | 'method' | 'newsletter';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          display_name: string;
          avatar_url: string | null;
          role: UserRole;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name?: string;
          last_name?: string;
          display_name?: string;
          avatar_url?: string | null;
          role?: UserRole;
          status?: string;
        };
        Update: Partial<Record<string, unknown>>;
      };

      authors: {
        Row: {
          id: string;
          name: string;
          slug: string;
          bio: string | null;
          job_title: string | null;
          photo_path: string | null;
          email_public: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          bio?: string | null;
          job_title?: string | null;
          photo_path?: string | null;
          email_public?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Record<string, unknown>>;
      };

      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          position: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          position?: number;
          is_active?: boolean;
        };
        Update: Partial<Record<string, unknown>>;
      };

      territories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          type: TerritoryType;
          description: string | null;
          cover_image_path: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          type?: TerritoryType;
          description?: string | null;
          cover_image_path?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Record<string, unknown>>;
      };

      articles: {
        Row: {
          id: string;
          title: string;
          slug: string;
          subtitle: string | null;
          excerpt: string | null;
          format: ArticleFormat;
          category_id: string | null;
          author_id: string | null;
          hero_image_path: string | null;
          hero_caption: string | null;
          hero_credit: string | null;
          status: ArticleStatus;
          featured: boolean;
          published_at: string | null;
          seo_title: string | null;
          seo_description: string | null;
          social_image_path: string | null;
          reading_time_minutes: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          subtitle?: string | null;
          excerpt?: string | null;
          format?: ArticleFormat;
          category_id?: string | null;
          author_id?: string | null;
          hero_image_path?: string | null;
          hero_caption?: string | null;
          hero_credit?: string | null;
          status?: ArticleStatus;
          featured?: boolean;
          published_at?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          social_image_path?: string | null;
          reading_time_minutes?: number | null;
        };
        Update: Partial<Record<string, unknown>>;
      };

      article_blocks: {
        Row: {
          id: string;
          article_id: string;
          type: ArticleBlockType;
          position: number;
          content_json: Record<string, unknown> | null;
          source_block_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          type: ArticleBlockType;
          position?: number;
          content_json?: Record<string, unknown> | null;
          source_block_id?: string | null;
        };
        Update: Partial<Record<string, unknown>>;
      };

      article_territories: {
        Row: {
          article_id: string;
          territory_id: string;
        };
        Insert: {
          article_id: string;
          territory_id: string;
        };
        Update: Partial<Record<string, unknown>>;
      };

      article_issue_sources: {
        Row: {
          id: string;
          article_id: string;
          issue_id: string | null;
          page_start: number | null;
          page_end: number | null;
          source_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          issue_id?: string | null;
          page_start?: number | null;
          page_end?: number | null;
          source_notes?: string | null;
        };
        Update: Partial<Record<string, unknown>>;
      };

      issues: {
        Row: {
          id: string;
          issue_number: string;
          slug: string;
          title: string;
          subtitle: string | null;
          description: string | null;
          publication_date: string;
          cover_image_path: string | null;
          page_count: number;
          status: IssueStatus;
          price_per_page: number;
          full_download_price: number;
          pdf_file_path: string | null;
          epub_file_path: string | null;
          subscriptions_allowed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          issue_number: string;
          slug: string;
          title: string;
          subtitle?: string | null;
          description?: string | null;
          publication_date?: string;
          cover_image_path?: string | null;
          page_count?: number;
          status?: IssueStatus;
          price_per_page?: number;
          full_download_price?: number;
          pdf_file_path?: string | null;
          epub_file_path?: string | null;
          subscriptions_allowed?: boolean;
        };
        Update: Partial<Record<string, unknown>>;
      };

      issue_pages: {
        Row: {
          id: string;
          issue_id: string;
          page_number: number;
          position: number;
          title: string | null;
          preview_image_path: string | null;
          full_image_path: string | null;
          is_free: boolean;
          individual_price: number | null;
          ocr_status: OcrStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          page_number: number;
          position?: number;
          title?: string | null;
          preview_image_path?: string | null;
          full_image_path?: string | null;
          is_free?: boolean;
          individual_price?: number | null;
          ocr_status?: OcrStatus;
        };
        Update: Partial<Record<string, unknown>>;
      };

      issue_assets: {
        Row: {
          id: string;
          issue_id: string;
          page_id: string | null;
          asset_type: AssetType;
          file_path: string;
          caption: string | null;
          credit: string | null;
          position: number;
          metadata_json: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          page_id?: string | null;
          asset_type?: AssetType;
          file_path: string;
          caption?: string | null;
          credit?: string | null;
          position?: number;
          metadata_json?: Record<string, unknown> | null;
        };
        Update: Partial<Record<string, unknown>>;
      };

      site_pages: {
        Row: {
          id: string;
          slug: string;
          title: string;
          content_json: Record<string, unknown> | null;
          status: 'draft' | 'published';
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          content_json?: Record<string, unknown> | null;
          status?: 'draft' | 'published';
          seo_title?: string | null;
          seo_description?: string | null;
        };
        Update: Partial<Record<string, unknown>>;
      };

      homepage_sections: {
        Row: {
          id: string;
          type: HomePageSectionType;
          position: number;
          is_visible: boolean;
          title: string | null;
          settings_json: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: HomePageSectionType;
          position?: number;
          is_visible?: boolean;
          title?: string | null;
          settings_json?: Record<string, unknown> | null;
        };
        Update: Partial<Record<string, unknown>>;
      };

      navigation: {
        Row: {
          id: string;
          location: NavigationLocation;
          label: string;
          url: string;
          position: number;
          is_visible: boolean;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          location: NavigationLocation;
          label: string;
          url: string;
          position?: number;
          is_visible?: boolean;
          parent_id?: string | null;
        };
        Update: Partial<Record<string, unknown>>;
      };

      site_settings: {
        Row: {
          key: string;
          value_json: unknown;
          updated_at: string;
        };
        Insert: {
          key: string;
          value_json?: unknown;
        };
        Update: Partial<Record<string, unknown>>;
      };

      products: {
        Row: {
          id: string;
          type: ProductType;
          resource_id: string | null;
          name: string;
          description: string | null;
          price: number;
          currency: string;
          is_active: boolean;
          external_price_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: ProductType;
          resource_id?: string | null;
          name: string;
          description?: string | null;
          price?: number;
          currency?: string;
          is_active?: boolean;
          external_price_id?: string | null;
        };
        Update: Partial<Record<string, unknown>>;
      };

      orders: {
        Row: {
          id: string;
          user_id: string;
          status: OrderStatus;
          total_amount: number;
          currency: string;
          payment_provider: string | null;
          external_payment_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          status?: OrderStatus;
          total_amount?: number;
          currency?: string;
          payment_provider?: string | null;
          external_payment_id?: string | null;
        };
        Update: Partial<Record<string, unknown>>;
      };

      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          resource_type: string;
          resource_id: string | null;
          unit_price: number;
          quantity: number;
          total_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          resource_type: string;
          resource_id?: string | null;
          unit_price?: number;
          quantity?: number;
          total_price?: number;
        };
        Update: Partial<Record<string, unknown>>;
      };

      entitlements: {
        Row: {
          id: string;
          user_id: string;
          resource_type: ResourceType;
          resource_id: string;
          source_type: SourceType;
          source_id: string | null;
          starts_at: string;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          resource_type: ResourceType;
          resource_id: string;
          source_type?: SourceType;
          source_id?: string | null;
          starts_at?: string;
          expires_at?: string | null;
        };
        Update: Partial<Record<string, unknown>>;
      };

      reading_progress: {
        Row: {
          id: string;
          user_id: string;
          issue_id: string;
          last_page: number;
          progress_percent: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          issue_id: string;
          last_page?: number;
          progress_percent?: number;
        };
        Update: Partial<Record<string, unknown>>;
      };

      downloads: {
        Row: {
          id: string;
          user_id: string;
          issue_id: string;
          file_type: string;
          downloaded_at: string;
          metadata_json: Record<string, unknown> | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          issue_id: string;
          file_type: string;
          metadata_json?: Record<string, unknown> | null;
        };
        Update: Partial<Record<string, unknown>>;
      };

      import_jobs: {
        Row: {
          id: string;
          created_by: string | null;
          source_file_path: string;
          source_type: string;
          status: ImportStatus;
          page_count: number | null;
          progress: number;
          error_message: string | null;
          metadata_json: Record<string, unknown> | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          created_by?: string | null;
          source_file_path: string;
          source_type?: string;
          status?: ImportStatus;
          page_count?: number | null;
          progress?: number;
          error_message?: string | null;
          metadata_json?: Record<string, unknown> | null;
          completed_at?: string | null;
        };
        Update: Partial<Record<string, unknown>>;
      };

      extracted_blocks: {
        Row: {
          id: string;
          import_job_id: string;
          page_number: number;
          type: ExtractedBlockType;
          source_text: string | null;
          edited_text: string | null;
          bounding_box_json: Record<string, unknown> | null;
          confidence: number;
          asset_path: string | null;
          status: ExtractedBlockStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          import_job_id: string;
          page_number: number;
          type?: ExtractedBlockType;
          source_text?: string | null;
          edited_text?: string | null;
          bounding_box_json?: Record<string, unknown> | null;
          confidence?: number;
          asset_path?: string | null;
          status?: ExtractedBlockStatus;
        };
        Update: Partial<Record<string, unknown>>;
      };

      ai_suggestions: {
        Row: {
          id: string;
          import_job_id: string;
          suggestion_type: string;
          source_reference: string | null;
          suggestion_json: Record<string, unknown> | null;
          status: AiSuggestionStatus;
          created_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
        };
        Insert: {
          id?: string;
          import_job_id: string;
          suggestion_type: string;
          source_reference?: string | null;
          suggestion_json?: Record<string, unknown> | null;
          status?: AiSuggestionStatus;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Update: Partial<Record<string, unknown>>;
      };
    };
  };
}
