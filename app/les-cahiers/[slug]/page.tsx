import Link from 'next/link';
import { ArrowRight, BookOpen, FileText, Download } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase/server';
import { PageRenderer, type PageBlockData, type PageLayout } from '@/components/editorial/page-renderer';

export const dynamic = 'force-dynamic';

interface DbIssue {
  id: string;
  issue_number: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  publication_date: string | null;
  cover_image_path: string | null;
  page_count: number;
  status: string;
  pdf_file_path: string | null;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { data: issue } = await supabaseAdmin
    .from('issues')
    .select('title, description, issue_number')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!issue) return { title: 'Cahier introuvable' };

  return {
    title: `${issue.title} · Cahier N°${issue.issue_number}`,
    description: issue.description ?? `Cahier N°${issue.issue_number}`,
  };
}

export default async function PublicIssuePage({ params }: { params: { slug: string } }) {
  const { data: dbIssue } = await supabaseAdmin
    .from('issues')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!dbIssue) {
    return (
      <div className="container-narrow py-20 text-center">
        <p className="text-[15px] text-muted">Cahier introuvable ou non publié.</p>
        <Link href="/les-cahiers" className="mt-4 inline-block text-sm text-ink hover:underline">
          Retour à la bibliothèque
        </Link>
      </div>
    );
  }

  const issue = dbIssue as DbIssue;

  const { data: dbBlocks } = await supabaseAdmin
    .from('page_blocks')
    .select('*')
    .eq('issue_id', issue.id)
    .order('page_number', { ascending: true })
    .order('position', { ascending: true });

  const allBlocks = (dbBlocks ?? []) as Array<Record<string, unknown>>;

  // Group blocks by page
  const pageMap = new Map<number, PageBlockData[]>();
  for (const b of allBlocks) {
    const pageNum = b.page_number as number;
    if (!pageMap.has(pageNum)) pageMap.set(pageNum, []);
    pageMap.get(pageNum)!.push({
      id: b.id as string,
      block_type: b.block_type as string,
      position: b.position as number,
      content_json: (b.content_json ?? {}) as PageBlockData['content_json'],
    });
  }

  const sortedPages = Array.from(pageMap.keys()).sort((a, b) => a - b);
  const hasStudioPages = sortedPages.length > 0;
  const hasPdf = Boolean(issue.pdf_file_path);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-ink">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="flex flex-col justify-between border-b border-border py-10 lg:col-span-7 lg:border-b-0 lg:border-r lg:py-16 lg:pr-16">
              <div>
                <div className="flex items-center gap-3">
                  <span className="eyebrow">Cahier N°{issue.issue_number}</span>
                  <span className="h-px w-8 bg-primary" aria-hidden />
                  <span className="eyebrow-muted">
                    {issue.publication_date
                      ? new Date(issue.publication_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
                      : ''}
                  </span>
                </div>
                <h1 className="display-title mt-6 text-[44px] leading-[0.94] sm:text-[60px] lg:text-[76px]">
                  {issue.title}
                </h1>
                {issue.subtitle && (
                  <p className="mt-4 text-[18px] text-text">{issue.subtitle}</p>
                )}
                {issue.description && (
                  <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-text">
                    {issue.description}
                  </p>
                )}
              </div>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                {hasStudioPages ? (
                  <a href="#page-1" className="btn-editorial">
                    <BookOpen className="h-4 w-4" />
                    Lire le Cahier
                    <ArrowRight className="h-4 w-4" />
                  </a>
                ) : hasPdf ? (
                  <a href={`/les-cahiers/${issue.slug}/lire`} className="btn-editorial">
                    <FileText className="h-4 w-4" />
                    Lire le PDF
                    <ArrowRight className="h-4 w-4" />
                  </a>
                ) : null}
                {hasPdf && (
                  <>
                    {hasStudioPages && (
                      <a href={`/les-cahiers/${issue.slug}/lire`} className="btn-editorial-outline">
                        <FileText className="h-4 w-4" />
                        Lire le PDF en ligne
                      </a>
                    )}
                    <a href={`/api/issues/${issue.id}/download`} className="btn-editorial-outline">
                      <Download className="h-4 w-4" />
                      Télécharger le PDF
                    </a>
                  </>
                )}
              </div>
            </div>
            {issue.cover_image_path && (
              <div className="relative min-h-[320px] bg-background-soft lg:col-span-5 lg:min-h-[600px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={issue.cover_image_path}
                  alt={`Couverture du Cahier N°${issue.issue_number}`}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Studio pages */}
      {hasStudioPages && sortedPages.map((pageNum) => {
        const pageBlocks = pageMap.get(pageNum) ?? [];
        const layoutBlock = pageBlocks.find((b) => b.position === 0);
        const layout = (layoutBlock?.content_json.pageLayout ?? '1-column') as PageLayout;

        return (
          <section key={pageNum} id={`page-${pageNum}`} className="border-b border-border">
            <div className="container-editorial py-14 lg:py-20">
              <div className="mb-8 flex items-center gap-3">
                <span className="font-display text-[24px] font-bold text-primary">
                  {String(pageNum).padStart(2, '0')}
                </span>
                <span className="h-px flex-1 bg-border" aria-hidden />
                <span className="text-xs text-muted">Page {pageNum}</span>
              </div>
              <div className="max-w-3xl">
                <PageRenderer blocks={pageBlocks} layout={layout} />
              </div>
            </div>
          </section>
        );
      })}

      {/* PDF-only section */}
      {!hasStudioPages && hasPdf && (
        <section className="border-b border-border">
          <div className="container-editorial py-14 lg:py-20 text-center">
            <div className="mx-auto max-w-2xl">
              <FileText className="mx-auto h-12 w-12 text-neutral-300" strokeWidth={1.5} />
              <h2 className="mt-6 font-display text-2xl font-bold text-ink">Document PDF</h2>
              <p className="mt-3 text-[15px] text-muted">
                Ce Cahier est disponible au format PDF. Lisez-le en ligne ou téléchargez-le.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a href={`/les-cahiers/${issue.slug}/lire`} className="btn-editorial">
                  <FileText className="h-4 w-4" />
                  Lire le PDF en ligne
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a href={`/api/issues/${issue.id}/download`} className="btn-editorial-outline">
                  <Download className="h-4 w-4" />
                  Télécharger le PDF
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer navigation */}
      <section className="border-t border-ink bg-ink text-white">
        <div className="container-editorial py-8 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.32em] text-white/85">
            Enquêter • Comprendre • Éclairer • Débattre
          </p>
        </div>
      </section>
    </>
  );
}
