'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Monitor, Tablet, Smartphone } from 'lucide-react';
import { PageRenderer, type PageBlockData, type PageLayout } from '@/components/editorial/page-renderer';

interface IssueData {
  id: string;
  title: string;
  subtitle: string;
  issue_number: string;
  status: string;
  page_count: number;
  scheduled_at: string | null;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const DEVICE_WIDTHS: Record<DeviceMode, string> = {
  desktop: 'max-w-4xl',
  tablet: 'max-w-2xl',
  mobile: 'max-w-sm',
};

export default function IssuePreviewPage({ issueId }: { issueId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [issue, setIssue] = useState<IssueData | null>(null);
  const [blocks, setBlocks] = useState<PageBlockData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [device, setDevice] = useState<DeviceMode>('desktop');

  const load = useCallback(async () => {
    const [issueResp, blocksResp] = await Promise.all([
      fetch(`/api/admin/issues/${issueId}`, { credentials: 'same-origin' }),
      fetch(`/api/admin/issues/${issueId}/blocks`, { credentials: 'same-origin' }),
    ]);

    if (issueResp.ok) {
      const d = await issueResp.json();
      setIssue({
        id: d.id, title: d.title ?? '', subtitle: d.subtitle ?? '',
        issue_number: d.issue_number ?? '', status: d.status ?? 'draft',
        page_count: d.page_count ?? 1, scheduled_at: d.scheduled_at ?? null,
      });
    }

    if (blocksResp.ok) {
      const data = await blocksResp.json() as Array<Record<string, unknown>>;
      setBlocks(data.map((b) => ({
        id: b.id as string,
        block_type: b.block_type as string,
        position: b.position as number,
        content_json: (b.content_json ?? {}) as PageBlockData['content_json'],
      })));
    }
    setLoading(false);
  }, [issueId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-neutral-400">Cahier introuvable.</p>
        <button onClick={() => router.push('/admin/cahiers')} className="mt-4 text-sm text-ink hover:underline">Retour à la liste</button>
      </div>
    );
  }

  const totalPages = issue.page_count;
  const pageBlocks = blocks
    .filter((b) => {
      const pageNum = (b.content_json as Record<string, unknown>).pageNumber as number | undefined;
      return pageNum === undefined || pageNum === currentPage;
    })
    .sort((a, b) => a.position - b.position);

  // Determine layout from first block's content_json.pageLayout
  const layoutBlock = blocks.find((b) => b.position === 0);
  const layout = (layoutBlock?.content_json.pageLayout ?? '1-column') as PageLayout;

  const isPublished = issue.status === 'published';
  const scheduledDate = issue.scheduled_at ? new Date(issue.scheduled_at) : null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-neutral-100">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/admin/cahiers/${issueId}/edit`)} className="rounded-lg border border-neutral-200 p-2 text-neutral-500 hover:bg-neutral-50">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="font-display text-lg font-bold text-neutral-800">{issue.title || 'Sans titre'}</h2>
            <p className="text-xs text-neutral-400">N°{issue.issue_number} — Prévisualisation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isPublished && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-700">
              {issue.status === 'scheduled' && scheduledDate
                ? `Programmé — ${scheduledDate.toLocaleDateString('fr-FR')} à ${scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                : 'Brouillon — Non public'}
            </span>
          )}
          {isPublished && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-green-700">
              Publié
            </span>
          )}
        </div>
      </div>

      {/* Device switcher */}
      <div className="flex items-center justify-center gap-2 border-b border-neutral-200 bg-white py-2">
        {(['desktop', 'tablet', 'mobile'] as const).map((d) => {
          const Icon = d === 'desktop' ? Monitor : d === 'tablet' ? Tablet : Smartphone;
          return (
            <button key={d} onClick={() => setDevice(d)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                device === d ? 'bg-ink text-white' : 'text-neutral-500 hover:bg-neutral-100'
              }`}>
              <Icon className="h-3.5 w-3.5" />
              {d === 'desktop' ? 'Ordinateur' : d === 'tablet' ? 'Tablette' : 'Mobile'}
            </button>
          );
        })}
      </div>

      {/* Page navigation */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-2">
        <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-30">
          <ChevronLeft className="h-4 w-4" /> Précédent
        </button>
        <span className="text-xs font-medium text-neutral-500">Page {currentPage} / {totalPages}</span>
        <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-30">
          Suivant <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className={`mx-auto ${DEVICE_WIDTHS[device]} transition-all duration-300`}>
          <div className="min-h-[600px] bg-white p-12 shadow-md">
            {pageBlocks.length === 0 ? (
              <p className="py-20 text-center text-sm text-neutral-300">Page vide</p>
            ) : (
              <PageRenderer blocks={pageBlocks} layout={layout} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
