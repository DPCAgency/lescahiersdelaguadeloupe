import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { ArrowLeft, Download } from 'lucide-react';
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
  return { title: `Lire — ${issue.title} (N°${issue.issue_number})` };
}

export default async function IssuePdfReaderPage({ params }: { params: { slug: string } }) {
  const { data: issue } = await supabaseAdmin
    .from('issues')
    .select('id, title, issue_number, pdf_file_path, status')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!issue || !issue.pdf_file_path) notFound();

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href={`/les-cahiers/${params.slug}`} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
            Retour au Cahier
          </Link>
          <span className="font-display text-sm font-semibold text-neutral-700">
            Cahier N°{issue.issue_number} — {issue.title}
          </span>
          <a
            href={`/api/issues/${issue.id}/download`}
            className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
          >
            <Download className="h-4 w-4" />
            Télécharger
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Desktop: iframe, Mobile: fallback link */}
        <div className="hidden sm:block">
          <iframe
            src={`/api/issues/${issue.id}/pdf-view`}
            title={`Cahier N°${issue.issue_number}`}
            className="h-[calc(100vh-120px)] w-full rounded-lg border border-neutral-200 bg-white"
          />
        </div>
        {/* Mobile fallback */}
        <div className="sm:hidden">
          <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
            <p className="text-sm text-neutral-500 mb-4">
              Le lecteur PDF intégré n'est pas optimisé sur mobile.
            </p>
            <a
              href={`/api/issues/${issue.id}/pdf-view`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90"
            >
              <ArrowLeft className="h-4 w-4 rotate-180" />
              Ouvrir le PDF
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
