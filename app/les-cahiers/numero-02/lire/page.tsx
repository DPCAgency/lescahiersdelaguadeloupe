import { supabaseAdmin } from '@/lib/supabase/server';
import { IssueReaderClient } from '@/components/reader/issue-reader-client';
import { supabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Lecture — Cahier N°02',
  description: 'Lisez le Cahier N°02 des Cahiers de la Guadeloupe page par page.',
  robots: { index: false, follow: true },
};

interface DbIssue {
  id: string;
  issue_number: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  publication_date: string | null;
  page_count: number;
  price_per_page: string;
  full_download_price: string;
  pdf_file_path: string | null;
  cover_image_path: string | null;
}

interface DbIssuePage {
  page_number: number;
  title: string | null;
  preview_image_path: string | null;
  full_image_path: string | null;
  is_free: boolean;
  individual_price: string | null;
}

export default async function ReaderPage({
  searchParams,
}: {
  searchParams: { preview?: string };
}) {
  const previewMode = searchParams.preview;
  const { data: dbIssue } = await supabaseAdmin
    .from('issues')
    .select('*')
    .eq('slug', 'numero-02')
    .eq('status', 'published')
    .maybeSingle();

  if (!dbIssue) {
    return (
      <div className="container-narrow py-20 text-center">
        <p className="text-[15px] text-muted">Cahier introuvable.</p>
      </div>
    );
  }

  const issue = dbIssue as DbIssue;

  const { data: dbPages } = await supabaseAdmin
    .from('issue_pages')
    .select('page_number, title, preview_image_path, full_image_path, is_free, individual_price')
    .eq('issue_id', issue.id)
    .order('page_number', { ascending: true });

  const pages = (dbPages as DbIssuePage[] | null)?.map((p) => ({
    pageNumber: p.page_number,
    title: p.title ?? '',
    previewImagePath: p.preview_image_path ?? '',
    fullImagePath: p.full_image_path ?? '',
    isFree: p.is_free,
    individualPrice: p.individual_price ? Number(p.individual_price) : null,
  })) ?? [];

  // Get feature flags
  const { data: flagsData } = await supabaseAdmin
    .from('feature_flags')
    .select('key, value');

  const flags: Record<string, boolean> = {};
  for (const f of flagsData ?? []) {
    flags[f.key] = f.value;
  }

  // Check user session and entitlements
  let userId: string | null = null;
  let isAdmin = false;
  let hasFullIssue = false;
  const purchasedPages: number[] = [];

  const { data: { session } } = await supabase.auth.getSession();

  // Admin preview modes: ?preview=buyer or ?preview=visitor
  // Only works for editor/admin/super_admin — ignored for normal users
  let previewAsBuyer = false;
  let previewAsVisitor = false;

  if (session?.user) {
    userId = session.user.id;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (profile && ['editor', 'admin', 'super_admin'].includes(profile.role)) {
      isAdmin = true;
      if (previewMode === 'buyer') {
        previewAsBuyer = true;
      } else if (previewMode === 'visitor') {
        previewAsVisitor = true;
      }
    }

    if (!isAdmin) {
      const { data: entitlements } = await supabaseAdmin
        .from('entitlements')
        .select('resource_type, source_type')
        .eq('user_id', userId)
        .eq('resource_id', issue.id)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

      for (const ent of entitlements ?? []) {
        if (ent.resource_type === 'issue_full') {
          hasFullIssue = true;
        }
        if (ent.resource_type === 'issue_page' && ent.source_type?.startsWith('page_')) {
          const pageNum = parseInt(ent.source_type.replace('page_', ''), 10);
          if (!isNaN(pageNum)) purchasedPages.push(pageNum);
        }
      }
    }
  }

  const paymentsEnabled = Boolean(flags.subscriptions_enabled) || Boolean(flags.page_purchase_enabled) || Boolean(flags.full_issue_purchase_enabled);

  // When payments are disabled (V1 free mode), grant access to all published content
  if (!paymentsEnabled) {
    hasFullIssue = true;
  }

  // Apply preview overrides
  if (previewAsBuyer) {
    hasFullIssue = true;
  } else if (previewAsVisitor) {
    hasFullIssue = false;
    purchasedPages.length = 0;
  }

  return (
    <IssueReaderClient
      issue={{
        id: issue.id,
        number: `N°${issue.issue_number}`,
        date: issue.publication_date
          ? new Date(issue.publication_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
          : '',
        title: issue.title,
        description: issue.description ?? '',
        pageCount: issue.page_count,
        pricePerPage: Number(issue.price_per_page),
        fullDownloadPrice: Number(issue.full_download_price),
        pdfFilePath: issue.pdf_file_path ?? '',
        pdfDownloadEnabled: flags.pdf_download_enabled ?? true,
      }}
      pages={pages}
      userId={userId}
      isAdmin={isAdmin}
      hasFullIssue={hasFullIssue}
      purchasedPages={purchasedPages}
      paymentsEnabled={paymentsEnabled}
    />
  );
}
