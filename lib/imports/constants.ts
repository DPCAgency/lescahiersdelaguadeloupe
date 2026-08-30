export const MAX_ISSUE_UPLOAD_SIZE = 100 * 1024 * 1024;

export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;

export const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'] as const;

export const IMPORTS_BUCKET = 'imports-private';

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
