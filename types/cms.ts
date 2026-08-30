export type {
  NavigationLocation,
  HomePageSectionType,
} from './database';

export interface SiteSettingEntry {
  key: string;
  value_json: unknown;
}

export interface FeatureFlags {
  subscriptions_enabled: boolean;
  page_purchase_enabled: boolean;
  full_issue_purchase_enabled: boolean;
  pdf_download_enabled: boolean;
  ai_import_enabled: boolean;
}
