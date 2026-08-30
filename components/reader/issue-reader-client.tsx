'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Lock, Check, Globe, ArrowRight, FileText, Download, X,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize,
  List, Grid3x3, BookOpen,
} from 'lucide-react';

interface ReaderPage {
  pageNumber: number;
  title: string;
  previewImagePath: string;
  fullImagePath: string;
  isFree: boolean;
  individualPrice: number | null;
}

interface ReaderIssue {
  id: string;
  number: string;
  date: string;
  title: string;
  description: string;
  pageCount: number;
  pricePerPage: number;
  fullDownloadPrice: number;
  pdfFilePath: string;
  pdfDownloadEnabled: boolean;
}

interface IssueReaderClientProps {
  issue: ReaderIssue;
  pages: ReaderPage[];
  userId: string | null;
  isAdmin: boolean;
  hasFullIssue: boolean;
  purchasedPages: number[];
  paymentsEnabled: boolean;
}

const ZOOM_LEVELS = [50, 75, 100, 125, 150, 200];
const FREE_PAGE_COUNT = 2;

export function IssueReaderClient({
  issue,
  pages,
  userId,
  isAdmin,
  hasFullIssue: initialHasFullIssue,
  purchasedPages: initialPurchasedPages,
  paymentsEnabled,
}: IssueReaderClientProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [pageImages, setPageImages] = useState<Record<number, string>>({});
  const [loadingPages, setLoadingPages] = useState<Set<number>>(new Set());
  const [hasFullIssue, setHasFullIssue] = useState(initialHasFullIssue);
  const [purchasedPages, setPurchasedPages] = useState<Set<number>>(new Set(initialPurchasedPages));
  const [showPaywall, setShowPaywall] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const storageUrl = `${supabaseUrl}/functions/v1/reader-access?action=page-image`;

  const currentPage = pages[currentPageIndex];

  const canAccess = useCallback((page: ReaderPage) => {
    if (!page) return false;
    if (!paymentsEnabled) return true;
    if (isAdmin) return true;
    if (page.isFree) return true;
    if (hasFullIssue) return true;
    if (purchasedPages.has(page.pageNumber)) return true;
    return false;
  }, [paymentsEnabled, isAdmin, hasFullIssue, purchasedPages]);

  const loadPageImage = useCallback(async (pageIndex: number) => {
    const page = pages[pageIndex];
    if (!page) return;

    const canSee = canAccess(page);
    const imagePath = canSee ? page.fullImagePath : page.previewImagePath;

    if (!imagePath || pageImages[page.pageNumber]) return;

    setLoadingPages((prev) => new Set(prev).add(page.pageNumber));

    try {
      const resp = await fetch(storageUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ path: imagePath }),
      });

      if (resp.ok) {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        setPageImages((prev) => ({ ...prev, [page.pageNumber]: url }));
      }
    } catch {
      // ignore
    } finally {
      setLoadingPages((prev) => {
        const next = new Set(prev);
        next.delete(page.pageNumber);
        return next;
      });
    }
  }, [pages, canAccess, pageImages, storageUrl, anonKey]);

  // Load current page + prefetch adjacent
  useEffect(() => {
    loadPageImage(currentPageIndex);
    if (currentPageIndex > 0) loadPageImage(currentPageIndex - 1);
    if (currentPageIndex < pages.length - 1) loadPageImage(currentPageIndex + 1);
  }, [currentPageIndex, loadPageImage, pages.length]);

  // Save reading progress
  useEffect(() => {
    if (!currentPage) return;
    const progress = Math.round(((currentPageIndex + 1) / issue.pageCount) * 100);

    if (userId) {
      fetch(`${supabaseUrl}/rest/v1/reading_progress?on_conflict=user_id,issue_id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          user_id: userId,
          issue_id: issue.id,
          last_page: currentPage.pageNumber,
          progress_percent: progress,
          updated_at: new Date().toISOString(),
        }),
      }).catch(() => {});
    } else {
      localStorage.setItem(`issue:${issue.id}:lastPage`, String(currentPage.pageNumber));
      localStorage.setItem(`issue:${issue.id}:progress`, String(progress));
    }
  }, [currentPageIndex, currentPage, issue.id, issue.pageCount, userId, supabaseUrl, anonKey]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentPageIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1));
      } else if (e.key === 'Escape') {
        setShowThumbnails(false);
        setShowSummary(false);
        setShowPaywall(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pages.length]);

  // Check for "resume reading" from localStorage
  useEffect(() => {
    if (!userId) {
      const saved = localStorage.getItem(`issue:${issue.id}:lastPage`);
      if (saved) {
        const pageNum = parseInt(saved, 10);
        const idx = pages.findIndex((p) => p.pageNumber === pageNum);
        if (idx > 0) setCurrentPageIndex(idx);
      }
    }
  }, [issue.id, userId, pages]);

  const goToPage = (index: number) => {
    if (index >= 0 && index < pages.length) {
      setCurrentPageIndex(index);
      setShowThumbnails(false);
      setShowSummary(false);
    }
  };

  const handleBuyFull = () => {
    if (!paymentsEnabled) return;
    window.location.href = '/les-cahiers/numero-02/acheter';
  };

  if (!currentPage) return null;

  const accessible = canAccess(currentPage);
  const zoomIndex = ZOOM_LEVELS.indexOf(zoom);

  return (
    <>
      {/* Barre du lecteur */}
      <div className="sticky top-[73px] z-30 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container-editorial flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/les-cahiers/numero-02" className="hidden items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted transition-colors hover:text-primary sm:flex">
              <ChevronLeft className="h-3.5 w-3.5" />
              {issue.number}
            </Link>
            <button
              onClick={() => setShowSummary(true)}
              className="flex h-8 w-8 items-center justify-center text-ink transition-colors hover:text-primary"
              aria-label="Sommaire"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowThumbnails(true)}
              className="flex h-8 w-8 items-center justify-center text-ink transition-colors hover:text-primary"
              aria-label="Miniatures"
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPageIndex - 1)}
              disabled={currentPageIndex === 0}
              className="flex h-8 w-8 items-center justify-center text-ink transition-colors hover:text-primary disabled:opacity-30"
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink">
              Page {currentPage.pageNumber} / {issue.pageCount}
            </span>
            <button
              onClick={() => goToPage(currentPageIndex + 1)}
              disabled={currentPageIndex === pages.length - 1}
              className="flex h-8 w-8 items-center justify-center text-ink transition-colors hover:text-primary disabled:opacity-30"
              aria-label="Page suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(ZOOM_LEVELS[Math.max(0, zoomIndex - 1)])}
              disabled={zoomIndex <= 0}
              className="flex h-8 w-8 items-center justify-center text-ink transition-colors hover:text-primary disabled:opacity-30"
              aria-label="Zoom arrière"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-[11px] font-medium text-muted">{zoom}%</span>
            <button
              onClick={() => setZoom(ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, zoomIndex + 1)])}
              disabled={zoomIndex >= ZOOM_LEVELS.length - 1}
              className="flex h-8 w-8 items-center justify-center text-ink transition-colors hover:text-primary disabled:opacity-30"
              aria-label="Zoom avant"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            {hasFullIssue && issue.pdfDownloadEnabled && (
              <a
                href={`/api/issues/${issue.id}/download`}
                className="ml-2 inline-flex items-center gap-1.5 border border-primary px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary transition-colors hover:bg-primary hover:text-white"
              >
                <Download className="h-3.5 w-3.5" />
                PDF
              </a>
            )}
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

      {/* Zone de lecture */}
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-background-soft py-8">
        {accessible ? (
          <div
            className="relative overflow-auto"
            style={{ maxWidth: `${zoom}%`, transition: 'max-width 0.3s ease' }}
          >
            <div className="relative mx-auto" style={{ maxWidth: '800px' }}>
              {pageImages[currentPage.pageNumber] ? (
                <img
                  src={pageImages[currentPage.pageNumber]}
                  alt={`Page ${currentPage.pageNumber} · ${currentPage.title}`}
                  className="w-full border border-border shadow-lg"
                />
              ) : (
                <div className="flex aspect-[3/4] w-full items-center justify-center border border-border bg-background">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
            </div>
          </div>
        ) : (
          paymentsEnabled ? (
            <Paywall
              issue={issue}
              page={currentPage}
              onBuyFull={handleBuyFull}
            />
          ) : (
            <div className="flex w-full max-w-md flex-col items-center px-6 py-16">
              <div className="w-full border border-border bg-background p-8">
                <p className="text-[14px] leading-relaxed text-text">
                  Cette page n'est pas encore disponible.
                </p>
              </div>
            </div>
          )
        )}
      </div>

      {/* Panneau miniatures */}
      {showThumbnails && (
        <ThumbnailsPanel
          pages={pages}
          currentPageNumber={currentPage.pageNumber}
          pageImages={pageImages}
          onGoToPage={(pageNum) => {
            const idx = pages.findIndex((p) => p.pageNumber === pageNum);
            if (idx >= 0) goToPage(idx);
          }}
          onClose={() => setShowThumbnails(false)}
          storageUrl={storageUrl}
          anonKey={anonKey}
        />
      )}

      {/* Panneau sommaire */}
      {showSummary && (
        <SummaryPanel
          pages={pages}
          currentPageNumber={currentPage.pageNumber}
          onGoToPage={(pageNum) => {
            const idx = pages.findIndex((p) => p.pageNumber === pageNum);
            if (idx >= 0) goToPage(idx);
          }}
          onClose={() => setShowSummary(false)}
        />
      )}
    </>
  );
}

function Paywall({
  issue,
  page,
  onBuyFull,
}: {
  issue: ReaderIssue;
  page: ReaderPage;
  onBuyFull: () => void;
}) {
  return (
    <div className="flex w-full max-w-md flex-col items-center px-6 py-16">
      <div className="w-full border border-border bg-background p-8">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <span className="eyebrow text-primary-dark">Page réservée</span>
        </div>
        <h3 className="article-title mt-4 text-[22px] leading-[1.1]">
          {page.title}
        </h3>
        <p className="mt-3 text-[14px] leading-relaxed text-text">
          Vous avez lu les pages accessibles gratuitement.
          Débloquez la suite de ce Cahier.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={onBuyFull}
            className="btn-editorial w-full"
          >
            <FileText className="h-4 w-4" />
            Acheter le Cahier complet · {issue.fullDownloadPrice.toFixed(2)} €
          </button>
          <p className="text-center text-[11px] text-muted">
            Accès à toutes les pages + téléchargement PDF
          </p>
        </div>
      </div>
    </div>
  );
}

function ThumbnailsPanel({
  pages,
  currentPageNumber,
  pageImages,
  onGoToPage,
  onClose,
  storageUrl,
  anonKey,
}: {
  pages: ReaderPage[];
  currentPageNumber: number;
  pageImages: Record<number, string>;
  onGoToPage: (pageNum: number) => void;
  onClose: () => void;
  storageUrl: string;
  anonKey: string;
}) {
  const [thumbUrls, setThumbUrls] = useState<Record<number, string>>({});

  useEffect(() => {
    pages.forEach(async (page) => {
      if (thumbUrls[page.pageNumber]) return;
      try {
        const resp = await fetch(storageUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
          body: JSON.stringify({ path: page.previewImagePath }),
        });
        if (resp.ok) {
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          setThumbUrls((prev) => ({ ...prev, [page.pageNumber]: url }));
        }
      } catch { /* ignore */ }
    });
  }, [pages, storageUrl, anonKey, thumbUrls]);

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-background">
      <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-5 py-3">
        <span className="eyebrow-ink">Pages</span>
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center" aria-label="Fermer">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="container-editorial py-8">
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {pages.map((page) => (
            <button
              key={page.pageNumber}
              onClick={() => onGoToPage(page.pageNumber)}
              className={`group relative aspect-[3/4] overflow-hidden border-2 transition-all ${
                page.pageNumber === currentPageNumber
                  ? 'border-primary'
                  : 'border-border hover:border-muted'
              }`}
            >
              {thumbUrls[page.pageNumber] ? (
                <img
                  src={thumbUrls[page.pageNumber]}
                  alt={page.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-background-soft">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-ink/70 px-2 py-1">
                <span className="font-display text-[12px] font-bold text-white">
                  {String(page.pageNumber).padStart(2, '0')}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryPanel({
  pages,
  currentPageNumber,
  onGoToPage,
  onClose,
}: {
  pages: ReaderPage[];
  currentPageNumber: number;
  onGoToPage: (pageNum: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-background">
      <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-5 py-3">
        <span className="eyebrow-ink">Sommaire</span>
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center" aria-label="Fermer">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="container-narrow py-8">
        <ol className="flex flex-col">
          {pages.map((page) => (
            <li key={page.pageNumber} className="border-t border-border">
              <button
                onClick={() => onGoToPage(page.pageNumber)}
                className={`group flex w-full items-start gap-4 py-5 text-left transition-colors ${
                  page.pageNumber === currentPageNumber ? 'text-primary' : 'text-ink hover:text-primary'
                }`}
              >
                <span className="font-display text-[24px] font-bold leading-none text-primary">
                  {String(page.pageNumber).padStart(2, '0')}
                </span>
                <div className="flex-1">
                  <h3 className="article-title text-[17px] leading-[1.12]">{page.title}</h3>
                </div>
                {page.isFree && (
                  <span className="inline-flex items-center gap-1 border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                    <Globe className="h-3 w-3" />
                    Gratuit
                  </span>
                )}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
