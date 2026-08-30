'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Lock, Check, Globe, ArrowRight, FileText, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { IssueSummary, IssuePage } from '@/types/editorial';
import { formatPrice } from '@/lib/demo-data';

interface PagePaywallProps {
  issue: IssueSummary;
  page: IssuePage;
  purchasedPages: Set<number>;
  hasFullIssue: boolean;
  onUnlockPage: (pageNumber: number) => void;
  onBuyFullIssue: () => void;
  onOpenSelector: () => void;
}

export function PagePaywall({
  issue,
  page,
  purchasedPages,
  hasFullIssue,
  onUnlockPage,
  onBuyFullIssue,
  onOpenSelector,
}: PagePaywallProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-background-soft px-6 py-16">
      <div className="w-full max-w-md border border-border bg-background p-8">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <span className="eyebrow text-primary-dark">Page réservée</span>
        </div>
        <h3 className="article-title mt-4 text-[22px] leading-[1.1]">
          {page.title}
        </h3>
        <p className="mt-3 text-[14px] leading-relaxed text-text">
          Cette page fait partie de l'édition complète des Cahiers de la Guadeloupe.
          Choisissez comment poursuivre votre lecture.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => onUnlockPage(page.pageNumber)}
            className="btn-editorial w-full"
          >
            Débloquer cette page · {formatPrice(issue.pricePerPage)}
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={onOpenSelector}
            className="btn-editorial-outline w-full"
          >
            Choisir plusieurs pages
          </button>

          <div className="my-2 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted">ou</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={onBuyFullIssue}
            className="inline-flex items-center justify-center gap-2 border border-primary bg-primary-light px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-primary-dark transition-colors hover:bg-primary hover:text-white"
          >
            <FileText className="h-4 w-4" />
            Cahier complet · {formatPrice(issue.fullDownloadPrice)}
          </button>
          <p className="text-center text-[11px] text-muted">
            Accès à toutes les pages + téléchargement PDF
          </p>
        </div>
      </div>
    </div>
  );
}

interface PageSelectorProps {
  issue: IssueSummary;
  pages: IssuePage[];
  purchasedPages: Set<number>;
  hasFullIssue: boolean;
  onUnlockPages: (pageNumbers: number[]) => void;
  onBuyFullIssue: () => void;
  onClose: () => void;
}

export function PageSelector({
  issue,
  pages,
  purchasedPages,
  hasFullIssue,
  onUnlockPages,
  onBuyFullIssue,
  onClose,
}: PageSelectorProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const togglePage = (pageNumber: number) => {
    const next = new Set(selected);
    if (next.has(pageNumber)) {
      next.delete(pageNumber);
    } else {
      next.add(pageNumber);
    }
    setSelected(next);
  };

  const selectablePages = pages.filter(
    (p) => !p.isFree && !purchasedPages.has(p.pageNumber) && !hasFullIssue,
  );

  const total = selected.size * issue.pricePerPage;
  const remainingToFull = issue.fullDownloadPrice - total;
  const showFullOffer = total > 0 && remainingToFull <= issue.pricePerPage * 2;

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-background">
      <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-5 py-3">
        <span className="eyebrow-ink">Choisir mes pages</span>
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center" aria-label="Fermer">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="container-editorial py-8">
        <p className="text-[15px] text-text">
          Sélectionnez les pages que vous souhaitez débloquer. Prix : {formatPrice(issue.pricePerPage)}/page.
        </p>

        <ul className="mt-6 flex flex-col">
          {selectablePages.map((page) => {
            const isSelected = selected.has(page.pageNumber);
            return (
              <li key={page.pageNumber} className="border-t border-border">
                <label className="flex cursor-pointer items-center gap-4 py-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => togglePage(page.pageNumber)}
                    className="h-5 w-5 accent-primary"
                  />
                  <span className="font-display text-[20px] font-bold text-primary">
                    {String(page.pageNumber).padStart(2, '0')}
                  </span>
                  <span className="flex-1 article-title text-[16px]">{page.title}</span>
                  <span className="text-[13px] font-medium text-muted">{formatPrice(issue.pricePerPage)}</span>
                </label>
              </li>
            );
          })}
        </ul>

        {showFullOffer && (
          <div className="mt-6 border-2 border-primary bg-primary-light p-5">
            <p className="eyebrow text-primary-dark">Plus avantageux</p>
            <p className="mt-2 text-[15px] text-ink">
              Pour seulement{' '}
              <span className="font-display text-[20px] font-bold text-primary">
                {formatPrice(Math.max(0, remainingToFull))}
              </span>{' '}
              de plus, obtenez le Cahier complet avec téléchargement PDF.
            </p>
            <button
              onClick={onBuyFullIssue}
              className="btn-editorial mt-4"
            >
              Acheter le cahier complet · {formatPrice(issue.fullDownloadPrice)}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="sticky bottom-0 mt-8 border-t border-ink bg-background py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-muted">
                {selected.size} page{selected.size > 1 ? 's' : ''} sélectionnée{selected.size > 1 ? 's' : ''}
              </p>
              <p className="font-display text-[24px] font-bold text-ink">
                Total : {formatPrice(total)}
              </p>
            </div>
            <button
              onClick={() => onUnlockPages(Array.from(selected))}
              disabled={selected.size === 0}
              className="btn-editorial disabled:opacity-30"
            >
              Débloquer les pages sélectionnées
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface IssueReaderProps {
  issue: IssueSummary;
  pages: IssuePage[];
}

export function IssueReader({ issue, pages }: IssueReaderProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [purchasedPages, setPurchasedPages] = useState<Set<number>>(new Set());
  const [hasFullIssue, setHasFullIssue] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [showPdfDownload, setShowPdfDownload] = useState(false);

  const currentPage = pages[currentPageIndex];

  const canAccess = useMemo(() => {
    if (!currentPage) return false;
    return currentPage.isFree || hasFullIssue || purchasedPages.has(currentPage.pageNumber);
  }, [currentPage, hasFullIssue, purchasedPages]);

  const handleUnlockPage = (pageNumber: number) => {
    setPurchasedPages((prev) => new Set(prev).add(pageNumber));
    setSelectorOpen(false);
  };

  const handleUnlockPages = (pageNumbers: number[]) => {
    setPurchasedPages((prev) => {
      const next = new Set(prev);
      pageNumbers.forEach((n) => next.add(n));
      return next;
    });
    setSelectorOpen(false);
  };

  const handleBuyFullIssue = () => {
    setHasFullIssue(true);
    setShowPdfDownload(true);
    setSelectorOpen(false);
  };

  const goToPage = (index: number) => {
    if (index >= 0 && index < pages.length) {
      setCurrentPageIndex(index);
    }
  };

  if (!currentPage) return null;

  return (
    <>
      {/* Barre du lecteur */}
      <div className="sticky top-[73px] z-30 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container-editorial flex items-center justify-between py-2.5">
          <div className="flex items-center gap-3">
            <Link href="/les-cahiers/numero-02" className="eyebrow-muted hover:text-primary hidden sm:inline">
              {issue.number}
            </Link>
            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink">
              Page {currentPage.pageNumber} / {issue.pageCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasFullIssue && showPdfDownload && (
              <a
                href={issue.pdfFile}
                download
                className="inline-flex items-center gap-1.5 border border-primary px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary transition-colors hover:bg-primary hover:text-white"
              >
                <Download className="h-3.5 w-3.5" />
                PDF
              </a>
            )}
            <button
              onClick={() => setSelectorOpen(true)}
              className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-primary hover:text-primary"
            >
              Sommaire
            </button>
          </div>
        </div>
        {/* Barre de progression */}
        <div className="h-0.5 w-full bg-border">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentPageIndex + 1) / issue.pageCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Page */}
      <div className="container-narrow py-8 lg:py-12">
        {canAccess ? (
          <div className="animate-fade-in">
            {/* En-tête de page */}
            <div className="mb-6 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <span className="font-display text-[28px] font-bold text-primary">
                  {String(currentPage.pageNumber).padStart(2, '0')}
                </span>
                <span className="h-px flex-1 bg-border" aria-hidden />
                {currentPage.isFree && (
                  <span className="inline-flex items-center gap-1 border border-border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
                    <Globe className="h-2.5 w-2.5" />
                    Gratuit
                  </span>
                )}
                {!currentPage.isFree && (hasFullIssue || purchasedPages.has(currentPage.pageNumber)) && (
                  <span className="inline-flex items-center gap-1 border border-primary px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-primary">
                    <Check className="h-2.5 w-2.5" />
                    Débloqué
                  </span>
                )}
              </div>
              <h1 className="article-title mt-4 text-[24px] leading-[1.1] sm:text-[32px] lg:text-[40px]">
                {currentPage.title}
              </h1>
            </div>

            {/* Contenu de la page */}
            <div className="body-prose">
              {currentPage.pageNumber === 1 && (
                <>
                  <p>
                    Les Cahiers de la Guadeloupe · {issue.number} · {issue.date}.
                  </p>
                  <p>
                    {issue.title}
                  </p>
                  <p className="mt-4 text-[15px] text-muted">
                    {issue.description}
                  </p>
                </>
              )}
              {currentPage.pageNumber === 2 && (
                <>
                  <p>
                    Ce cahier ne désigne pas de coupables. Il pose une question : qui exerce
                    réellement l'influence dans la fabrication de la décision publique au Gosier ?
                  </p>
                  <p>
                    La rédaction a travaillé à partir de documents publics, de témoignages recueillis
                    auprès d'élus, d'agents municipaux et d'acteurs locaux, et de l'analyse des
                    mécanismes institutionnels.
                  </p>
                  <p>
                    Les faits sont présentés comme des faits. Les témoignages sont identifiés comme
                    tels. Les rapprochements restent des rapprochements. Les hypothèses restent des
                    hypothèses.
                  </p>
                </>
              )}
              {currentPage.pageNumber > 2 && (
                <>
                  <p>
                    {currentPage.title}.
                  </p>
                  <p className="mt-4 text-[15px] text-muted">
                    Le contenu de cette page fait partie de l'enquête complète. Il sera disponible
                    après déverrouillage.
                  </p>
                </>
              )}
            </div>

            {/* Navigation */}
            <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
              <button
                onClick={() => goToPage(currentPageIndex - 1)}
                disabled={currentPageIndex === 0}
                className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted transition-colors hover:text-primary disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
                Page précédente
              </button>
              <span className="text-[12px] text-muted">
                {currentPage.pageNumber} / {issue.pageCount}
              </span>
              <button
                onClick={() => goToPage(currentPageIndex + 1)}
                disabled={currentPageIndex === pages.length - 1}
                className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted transition-colors hover:text-primary disabled:opacity-30"
              >
                Page suivante
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <PagePaywall
            issue={issue}
            page={currentPage}
            purchasedPages={purchasedPages}
            hasFullIssue={hasFullIssue}
            onUnlockPage={handleUnlockPage}
            onBuyFullIssue={handleBuyFullIssue}
            onOpenSelector={() => setSelectorOpen(true)}
          />
        )}
      </div>

      {/* Sélecteur de pages */}
      {selectorOpen && (
        <PageSelector
          issue={issue}
          pages={pages}
          purchasedPages={purchasedPages}
          hasFullIssue={hasFullIssue}
          onUnlockPages={handleUnlockPages}
          onBuyFullIssue={handleBuyFullIssue}
          onClose={() => setSelectorOpen(false)}
        />
      )}
    </>
  );
}
