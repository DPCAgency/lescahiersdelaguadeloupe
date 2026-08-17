import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Eye, FileText, Lock, Globe, BookOpen } from 'lucide-react';
import { DossierSection } from '@/components/homepage/dossier-section';
import { CentralQuestion } from '@/components/editorial/central-question';
import { KeyFigures } from '@/components/editorial/key-figures';
import { EditorialQuote } from '@/components/editorial/editorial-quote';
import { SectionTitle } from '@/components/editorial/section-title';
import { issueN02, issueN02Pages, issueN02Chapters } from '@/data/issues';
import { centralQuestionData, keyFiguresData } from '@/data/homepage';
import { formatPrice } from '@/lib/utils/format';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { IssuePage } from '@/types/editorial';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const { data: dbIssue } = await supabaseAdmin
    .from('issues')
    .select('*')
    .eq('slug', 'numero-02')
    .eq('status', 'published')
    .maybeSingle();

  return {
    title: dbIssue ? `${dbIssue.title} — Cahier N°${dbIssue.issue_number}` : 'N°02 — Qui gouverne réellement Le Gosier ?',
    description: dbIssue?.description ?? 'Cahier N°02 — Août 2026. Enquête en 11 pages sur la gouvernance locale au Gosier.',
    openGraph: {
      title: dbIssue?.title ?? 'Qui gouverne réellement Le Gosier ?',
      description: dbIssue?.description ?? 'Cahier N°02 des Cahiers de la Guadeloupe',
      images: dbIssue?.cover_image_path ? [{ url: dbIssue.cover_image_path }] : undefined,
    },
  };
}

interface DbIssuePage {
  page_number: number;
  title: string | null;
  preview_image_path: string | null;
  is_free: boolean;
  individual_price: number | null;
}

export default async function Page() {
  let issue = issueN02;
  let pages: IssuePage[] = issueN02Pages;
  let fullPrice = 2.90;

  const { data: dbIssue } = await supabaseAdmin
    .from('issues')
    .select('*')
    .eq('slug', 'numero-02')
    .eq('status', 'published')
    .maybeSingle();

  if (dbIssue) {
    issue = {
      number: `N°${dbIssue.issue_number}`,
      date: dbIssue.publication_date
        ? new Date(dbIssue.publication_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
        : issueN02.date,
      title: dbIssue.title,
      subtitle: dbIssue.subtitle ?? '',
      cover: dbIssue.cover_image_path ?? '',
      description: dbIssue.description ?? '',
      pageCount: dbIssue.page_count,
      pricePerPage: Number(dbIssue.price_per_page),
      fullDownloadPrice: Number(dbIssue.full_download_price),
      pdfFile: dbIssue.pdf_file_path ?? '',
    };
    fullPrice = Number(dbIssue.full_download_price);

    const { data: dbPages } = await supabaseAdmin
      .from('issue_pages')
      .select('page_number, title, preview_image_path, is_free, individual_price')
      .eq('issue_id', dbIssue.id)
      .order('page_number', { ascending: true });

    if (dbPages && dbPages.length > 0) {
      pages = (dbPages as DbIssuePage[]).map((p) => ({
        pageNumber: p.page_number,
        title: p.title ?? '',
        previewImage: p.preview_image_path ?? '',
        isFree: p.is_free,
        price: p.individual_price ? Number(p.individual_price) : undefined,
      }));
    }
  }

  const freePages = pages.filter((p) => p.isFree);

  return (
    <>
      {/* Hero — Couverture du numéro */}
      <section className="border-b border-ink">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="flex flex-col justify-between border-b border-border py-10 lg:col-span-7 lg:border-b-0 lg:border-r lg:py-16 lg:pr-16">
              <div>
                <div className="flex items-center gap-3">
                  <span className="eyebrow">Cahier {issue.number}</span>
                  <span className="h-px w-8 bg-primary" aria-hidden />
                  <span className="eyebrow-muted">{issue.date}</span>
                </div>
                <h1 className="display-title mt-6 text-[44px] leading-[0.94] sm:text-[60px] lg:text-[76px]">
                  Qui gouverne
                  <br />
                  réellement
                  <br />
                  <span className="text-primary">Le Gosier ?</span>
                </h1>
                <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-text">
                  {issue.description}
                </p>
              </div>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link href="/les-cahiers/numero-02/lire" className="btn-editorial">
                  <BookOpen className="h-4 w-4" />
                  Lire le Cahier
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/les-cahiers/numero-02/acheter" className="btn-editorial-outline">
                  <FileText className="h-4 w-4" />
                  Acheter le Cahier — {formatPrice(fullPrice)}
                </Link>
              </div>
            </div>
            <div className="relative min-h-[320px] bg-background-soft lg:col-span-5 lg:min-h-[600px]">
              <Image
                src={issue.cover ?? ''}
                alt="Couverture du Cahier N°02"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Informations de lecture */}
      <section className="border-b border-border bg-background-soft">
        <div className="container-editorial py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink">
                <span className="font-display text-[20px] font-bold text-primary">{issue.pageCount}</span> pages
              </span>
              <span className="h-4 w-px bg-border" aria-hidden />
              <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
                <Globe className="h-3.5 w-3.5" />
                Couverture + 1ère page offertes
              </span>
              <span className="h-4 w-px bg-border" aria-hidden />
              <span className="text-[13px] font-medium text-primary">
                Complet : {formatPrice(fullPrice)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Aperçu des pages gratuites */}
      <section className="border-b border-border">
        <div className="container-editorial py-14 lg:py-20">
          <div className="max-w-3xl">
            <p className="eyebrow">Découverte</p>
            <h2 className="section-title mt-3 text-[28px] sm:text-[36px] lg:text-[44px]">
              Feuilletez gratuitement
            </h2>
            <p className="mt-4 text-[15px] text-text">
              La couverture et la première page éditoriale sont offertes à tous les lecteurs.
              Le reste du Cahier est accessible à partir de {formatPrice(issue.pricePerPage)}/page
              ou en achetant le Cahier complet.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {freePages.map((page) => (
              <Link
                key={page.pageNumber}
                href="/les-cahiers/numero-02/lire"
                className="group block"
              >
                <div className="relative aspect-[3/4] overflow-hidden border border-border bg-background-soft transition-shadow hover:shadow-lg">
                  {page.previewImage && (
                    <FreePageImage path={page.previewImage} alt={page.title} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute bottom-3 left-3 right-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="inline-flex items-center gap-1 bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink">
                      <Eye className="h-3 w-3" />
                      Lire
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="font-display text-[16px] font-bold text-primary">
                    {String(page.pageNumber).padStart(2, '0')}
                  </span>
                  <span className="text-[13px] text-text">{page.title}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Sommaire détaillé */}
      <section className="container-editorial py-14 lg:py-20">
        <div className="max-w-3xl">
          <p className="eyebrow">Sommaire</p>
          <h2 className="section-title mt-3 text-[28px] sm:text-[36px] lg:text-[44px]">
            Les pages de ce cahier
          </h2>
        </div>

        <ol className="mt-10 flex flex-col">
          {pages.map((page) => (
            <li key={page.pageNumber} className="border-t border-border">
              <Link href="/les-cahiers/numero-02/lire" className="group grid grid-cols-1 items-start gap-3 py-5 sm:grid-cols-12 sm:gap-6 transition-colors hover:bg-background-soft">
                <span className="font-display text-[24px] font-bold leading-none text-primary sm:col-span-2 sm:text-[32px]">
                  {String(page.pageNumber).padStart(2, '0')}
                </span>
                <div className="sm:col-span-7">
                  <h3 className="article-title text-[18px] leading-[1.12] sm:text-[20px]">
                    {page.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 sm:col-span-3 sm:justify-end">
                  {page.isFree ? (
                    <span className="inline-flex items-center gap-1 border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      <Globe className="h-3 w-3" />
                      Gratuit
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 border border-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                      <Lock className="h-3 w-3" />
                      {formatPrice(page.price ?? issue.pricePerPage)}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/les-cahiers/numero-02/lire" className="btn-editorial">
            <Eye className="h-4 w-4" />
            Commencer la lecture
          </Link>
          <Link href="/les-cahiers/numero-02/acheter" className="btn-editorial-outline">
            <FileText className="h-4 w-4" />
            Cahier complet — {formatPrice(fullPrice)}
          </Link>
        </div>
      </section>

      {/* Question centrale */}
      <section className="border-t border-border bg-background-soft">
        <div className="container-editorial py-14 lg:py-20">
          <div className="max-w-4xl">
            <CentralQuestion question={centralQuestionData} />
          </div>
        </div>
      </section>

      {/* À retenir */}
      <section className="border-t border-border">
        <div className="container-editorial py-14 lg:py-20">
          <SectionTitle eyebrow="Repères" title="À retenir" />
          <div className="mt-10">
            <KeyFigures figures={keyFiguresData} />
          </div>
        </div>
      </section>

      {/* Dossier */}
      <DossierSection chapters={issueN02Chapters} />

      {/* Citation */}
      <section className="border-t border-border bg-background-soft">
        <div className="container-narrow py-16 lg:py-24">
          <EditorialQuote
            text="La transparence n'est pas un accessoire. Elle constitue une condition de la confiance publique."
            level="analyse"
          />
        </div>
      </section>

      {/* Signature méthodologique */}
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

function FreePageImage({ path, alt }: { path: string; alt: string }) {
  const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/reader-access?action=page-image`;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <img
      src={`${imageUrl}`}
      alt={alt}
      className="h-full w-full object-cover"
      loading="lazy"
      data-page-path={path}
      ref={async (el) => {
        if (!el || el.dataset.loaded === 'true') return;
        el.dataset.loaded = 'true';
        try {
          const resp = await fetch(imageUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${anonKey}`,
            },
            body: JSON.stringify({ path, quality: 'preview' }),
          });
          if (resp.ok) {
            const blob = await resp.blob();
            el.src = URL.createObjectURL(blob);
          }
        } catch {
          // keep placeholder
        }
      }}
    />
  );
}
