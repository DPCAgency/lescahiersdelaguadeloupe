import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { ArrowLeft, Download, FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: issue } = await supabaseAdmin
    .from('issues')
    .select('title, issue_number')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!issue) return { title: 'Cahier introuvable' };
  return { title: `Lire · ${issue.title} (N°${issue.issue_number})`, robots: { index: false, follow: true } };
}

export default async function IssuePdfReaderPage({ params }: { params: { slug: string } }) {
  const { data: issue } = await supabaseAdmin
    .from('issues')
    .select('id, title, issue_number, publication_date, pdf_file_path, status')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!issue || !issue.pdf_file_path) notFound();

  const pubDate = issue.publication_date
    ? new Date(issue.publication_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
    : '';

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href={`/les-cahiers/${params.slug}`} className="flex shrink-0 items-center gap-2 text-sm text-neutral-500 hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Retour au Cahier</span>
            <span className="sm:hidden">Retour</span>
          </Link>
          <span className="truncate font-display text-sm font-semibold text-neutral-700">
            N°{issue.issue_number}{pubDate ? ` · ${pubDate}` : ''}
          </span>
          <a
            href={`/api/issues/${issue.id}/download`}
            className="flex shrink-0 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Télécharger le PDF</span>
            <span className="sm:hidden">PDF</span>
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="mb-4 text-center font-display text-xl font-bold text-neutral-800 sm:text-2xl">
          {issue.title}
        </h1>

        {/* Desktop / tablet: iframe PDF viewer */}
        <div className="hidden sm:block">
          <iframe
            src={`/api/issues/${issue.id}/pdf-view`}
            title={`Cahier N°${issue.issue_number} · ${issue.title}`}
            className="h-[calc(100vh-180px)] min-h-[600px] w-full rounded-lg border border-neutral-200 bg-white"
          />
        </div>

        {/* Mobile: open/download buttons */}
        <div className="sm:hidden">
          <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-neutral-300" strokeWidth={1.5} />
            <p className="mt-4 text-sm text-neutral-500">
              Le lecteur PDF intégré n'est pas optimisé sur mobile.
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Ouvrez le PDF dans une nouvelle fenêtre ou téléchargez-le.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <a
                href={`/api/issues/${issue.id}/pdf-view`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-medium text-white hover:bg-ink/90"
              >
                <ExternalLink className="h-4 w-4" />
                Ouvrir le PDF
              </a>
              <a
                href={`/api/issues/${issue.id}/download`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <Download className="h-4 w-4" />
                Télécharger le PDF
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
