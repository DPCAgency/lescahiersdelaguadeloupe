'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Loader2, ArrowLeft, Save, Plus, Trash2, ChevronUp, ChevronDown,
  Type, AlignLeft, Image as ImageIcon, Quote, BarChart3, Minus,
  PanelRight, Eye, FileText, Layers, Copy, X,
  Bold, Italic, List, Undo2, Redo2,
} from 'lucide-react';
import { RichTextEditor } from './rich-text-editor';

type BlockType = 'heading' | 'subheading' | 'paragraph' | 'image' | 'quote' | 'key_figure' | 'separator' | 'sidebar';
type PageLayout = '1-column' | '2-columns' | 'hero-image' | 'image-text';
type FontSize = 'sm' | 'base' | 'lg' | 'xl';
type Alignment = 'left' | 'center' | 'right';
type ImageWidth = 'normal' | 'wide' | 'full';

interface BlockContent {
  text?: string;
  richContent?: unknown;
  imageUrl?: string;
  caption?: string;
  credit?: string;
  alt?: string;
  alignment?: Alignment;
  fontSize?: FontSize;
  figure?: string;
  source?: string;
  imageWidth?: ImageWidth;
  spaceBefore?: 'none' | 'sm' | 'md' | 'lg';
  spaceAfter?: 'none' | 'sm' | 'md' | 'lg';
  articleId?: string;
}

interface PageBlock {
  id: string;
  page_number: number;
  block_type: string;
  position: number;
  content_json: BlockContent;
}

interface PageMeta {
  layout: PageLayout;
}

interface IssueData {
  id: string;
  issue_number: string;
  title: string;
  subtitle: string;
  description: string;
  publication_date: string;
  cover_image_path: string;
  page_count: number;
  status: string;
  price_per_page: string;
  full_download_price: string;
  theme: string;
  editorial_director: string;
  free_pages_count: number;
  download_enabled: boolean;
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: typeof Type }[] = [
  { type: 'heading', label: 'Titre', icon: Type },
  { type: 'subheading', label: 'Sous-titre', icon: Type },
  { type: 'paragraph', label: 'Texte', icon: AlignLeft },
  { type: 'image', label: 'Image', icon: ImageIcon },
  { type: 'quote', label: 'Citation', icon: Quote },
  { type: 'key_figure', label: 'Chiffre clé', icon: BarChart3 },
  { type: 'separator', label: 'Séparateur', icon: Minus },
  { type: 'sidebar', label: 'Encadré', icon: PanelRight },
];

const LAYOUTS: { value: PageLayout; label: string }[] = [
  { value: '1-column', label: '1 colonne' },
  { value: '2-columns', label: '2 colonnes' },
  { value: 'hero-image', label: 'Image pleine' },
  { value: 'image-text', label: 'Image + Texte' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'ready', label: 'Prêt' },
  { value: 'scheduled', label: 'Programmé' },
  { value: 'published', label: 'Publié' },
  { value: 'archived', label: 'Archivé' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-600',
  ready: 'bg-blue-100 text-blue-700',
  scheduled: 'bg-amber-100 text-amber-700',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-neutral-200 text-neutral-500',
};

const SPACE_CLASSES: Record<string, string> = {
  none: 'my-0', sm: 'my-2', md: 'my-4', lg: 'my-8',
};

const FONT_CLASSES: Record<FontSize, string> = {
  sm: 'text-sm', base: 'text-base', lg: 'text-lg', xl: 'text-xl',
};

const ALIGN_CLASSES: Record<Alignment, string> = {
  left: 'text-left', center: 'text-center', right: 'text-right',
};

const IMG_WIDTH_CLASSES: Record<ImageWidth, string> = {
  normal: 'max-w-md', wide: 'max-w-2xl', full: 'w-full',
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function EditorialStudio({ issueId }: { issueId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [issue, setIssue] = useState<IssueData | null>(null);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [pageLayouts, setPageLayouts] = useState<Record<number, PageLayout>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deletedBlockIds = useRef<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const load = useCallback(async () => {
    try {
      const [issueResp, blocksResp] = await Promise.all([
        fetch(`/api/admin/issues/${issueId}`, { credentials: 'same-origin' }),
        fetch(`/api/admin/issues/${issueId}/blocks`, { credentials: 'same-origin' }),
      ]);

      if (issueResp.ok) {
        const d = await issueResp.json();
        setIssue({
          id: d.id, issue_number: d.issue_number ?? '', title: d.title ?? '',
          subtitle: d.subtitle ?? '', description: d.description ?? '',
          publication_date: d.publication_date ?? '', cover_image_path: d.cover_image_path ?? '',
          page_count: d.page_count ?? 1, status: d.status ?? 'draft',
          price_per_page: d.price_per_page?.toString() ?? '0.30',
          full_download_price: d.full_download_price?.toString() ?? '2.90',
          theme: d.theme ?? '', editorial_director: d.editorial_director ?? '',
          free_pages_count: d.free_pages_count ?? 1, download_enabled: d.download_enabled ?? true,
        });
      }

      if (blocksResp.ok) {
        const blockData = await blocksResp.json() as Array<Record<string, unknown>>;
        const loaded = blockData.map((b) => ({
          id: b.id as string,
          page_number: b.page_number as number,
          block_type: b.block_type as string,
          position: b.position as number,
          content_json: (b.content_json ?? {}) as BlockContent,
        }));
        setBlocks(loaded);

        // Extract page layouts from block content_json if stored
        const layouts: Record<number, PageLayout> = {};
        for (const b of loaded) {
          if ((b.content_json as Record<string, unknown>)?.pageLayout) {
            layouts[b.page_number] = (b.content_json as Record<string, unknown>).pageLayout as PageLayout;
          }
        }
        setPageLayouts(layouts);
      }
    } catch (err) {
      console.error('Load error:', err);
    }
    setLoading(false);
  }, [issueId]);

  useEffect(() => { load(); }, [load]);

  const pageBlocks = blocks
    .filter((b) => b.page_number === currentPage)
    .sort((a, b) => a.position - b.position);

  const totalPages = issue?.page_count ?? 1;
  const selectedBlock = pageBlocks.find((b) => b.id === selectedBlockId) ?? null;
  const currentLayout = pageLayouts[currentPage] ?? '1-column';

  const markDirty = useCallback(() => {
    setSaveState('idle');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { saveAll(); }, 1500);
  }, []);

  const addBlock = (blockType: string) => {
    const newPos = pageBlocks.length > 0 ? Math.max(...pageBlocks.map((b) => b.position)) + 1 : 0;
    const newBlock: PageBlock = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      page_number: currentPage,
      block_type: blockType,
      position: newPos,
      content_json: {},
    };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
    markDirty();
  };

  const updateBlockContent = (blockId: string, updates: Partial<BlockContent>) => {
    setBlocks((prev) => prev.map((b) =>
      b.id === blockId ? { ...b, content_json: { ...b.content_json, ...updates } } : b
    ));
    markDirty();
  };

  const deleteBlock = (blockId: string) => {
    if (!confirm('Supprimer ce bloc ?')) return;
    if (!blockId.startsWith('temp-')) {
      deletedBlockIds.current.add(blockId);
    }
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    if (selectedBlockId === blockId) setSelectedBlockId(null);
    markDirty();
  };

  const duplicateBlock = (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    const newPos = pageBlocks.length > 0 ? Math.max(...pageBlocks.map((b) => b.position)) + 1 : 0;
    const newBlock: PageBlock = {
      ...block,
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      position: newPos,
      content_json: { ...block.content_json },
    };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
    markDirty();
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const sorted = [...pageBlocks];
    const idx = sorted.findIndex((b) => b.id === blockId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const reordered = arrayMove(sorted, idx, swapIdx);
    reordered.forEach((b, i) => { b.position = i; });
    setBlocks((prev) => prev.map((b) => {
      const found = reordered.find((r) => r.id === b.id);
      return found ? { ...b, position: found.position } : b;
    }));
    markDirty();
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const sorted = [...pageBlocks];
    const oldIndex = sorted.findIndex((b) => b.id === active.id);
    const newIndex = sorted.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(sorted, oldIndex, newIndex);
    reordered.forEach((b, i) => { b.position = i; });
    setBlocks((prev) => prev.map((b) => {
      const found = reordered.find((r) => r.id === b.id);
      return found ? { ...b, position: found.position } : b;
    }));
    markDirty();
  };

  const addPage = async () => {
    if (!issue) return;
    const newPageNum = totalPages + 1;
    setIssue({ ...issue, page_count: newPageNum });
    setCurrentPage(newPageNum);
    markDirty();
  };

  const setLayout = (layout: PageLayout) => {
    setPageLayouts((prev) => ({ ...prev, [currentPage]: layout }));
    markDirty();
  };

  const updateIssue = (field: keyof IssueData, value: string | number | boolean) => {
    setIssue((prev) => prev ? { ...prev, [field]: value } : null);
    markDirty();
  };

  const saveAll = useCallback(async () => {
    if (!issue) return;
    setSaveState('saving');
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }

    try {
      await fetch(`/api/admin/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          title: issue.title || 'Sans titre',
          subtitle: issue.subtitle || null,
          description: issue.description || null,
          publication_date: issue.publication_date || null,
          cover_image_path: issue.cover_image_path || null,
          page_count: issue.page_count,
          status: issue.status,
          price_per_page: parseFloat(issue.price_per_page) || 0.30,
          full_download_price: parseFloat(issue.full_download_price) || 2.90,
          theme: issue.theme || null,
          editorial_director: issue.editorial_director || null,
          free_pages_count: issue.free_pages_count,
          download_enabled: issue.download_enabled,
        }),
      });

      // Delete removed blocks
      for (const blockId of Array.from(deletedBlockIds.current)) {
        await fetch(`/api/admin/issues/${issueId}/blocks/${blockId}`, {
          method: 'DELETE',
          credentials: 'same-origin',
        });
      }
      deletedBlockIds.current.clear();

      // Create/update blocks
      for (const block of blocks) {
        const contentWithLayout: Record<string, unknown> = { ...block.content_json };
        if (block.position === 0) {
          contentWithLayout.pageLayout = pageLayouts[block.page_number];
        }

        if (block.id.startsWith('temp-')) {
          const resp = await fetch(`/api/admin/issues/${issueId}/blocks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
              page_number: block.page_number,
              block_type: block.block_type,
              position: block.position,
              content_json: contentWithLayout,
            }),
          });
          if (resp.ok) {
            const newBlock = await resp.json();
            setBlocks((prev) => prev.map((b) => b.id === block.id ? { ...b, id: newBlock.id } : b));
          }
        } else {
          await fetch(`/api/admin/issues/${issueId}/blocks/${block.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
              page_number: block.page_number,
              block_type: block.block_type,
              position: block.position,
              content_json: contentWithLayout,
            }),
          });
        }
      }
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch (err) {
      console.error('Save error:', err);
      setSaveState('error');
    }
  }, [issue, blocks, issueId, pageLayouts]);

  const changeStatus = async (newStatus: string) => {
    if (!issue) return;
    updateIssue('status', newStatus);
    await fetch(`/api/admin/issues/${issueId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ status: newStatus }),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.push('/admin/cahiers')} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <p className="text-sm text-neutral-400">Cahier introuvable.</p>
      </div>
    );
  }

  if (previewMode) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-neutral-100">
        <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-2">
          <span className="text-xs font-medium text-neutral-500">Aperçu — Page {currentPage}</span>
          <button onClick={() => setPreviewMode(false)} className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50">
            <X className="h-3.5 w-3.5" /> Quitter l'aperçu
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-2xl">
            <div className="min-h-[600px] bg-white p-16 shadow-md">
              {pageBlocks.length === 0 ? (
                <p className="py-20 text-center text-sm text-neutral-300">Page vide</p>
              ) : (
                pageBlocks.map((block) => (
                  <BlockPreview key={block.id} block={block} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/cahiers')} className="rounded-lg border border-neutral-200 p-2 text-neutral-500 hover:bg-neutral-50">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="font-display text-lg font-bold text-neutral-800">{issue.title || 'Sans titre'}</h2>
            <p className="text-xs text-neutral-400">N°{issue.issue_number}</p>
          </div>
          <SaveIndicator state={saveState} />
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[issue.status] ?? ''}`}>
            {STATUS_OPTIONS.find((s) => s.value === issue.status)?.label ?? issue.status}
          </span>
          <select value={issue.status} onChange={(e) => changeStatus(e.target.value)} className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs">
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button onClick={() => setPreviewMode(true)} className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50">
            <Eye className="h-3.5 w-3.5" /> Aperçu
          </button>
          <button onClick={saveAll} disabled={saveState === 'saving'} className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white hover:bg-ink/90 disabled:opacity-50">
            {saveState === 'saving' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Enregistrer
          </button>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Pages + Blocks */}
        <div className="w-56 shrink-0 overflow-y-auto border-r border-neutral-200 bg-neutral-50 p-3">
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Pages</h3>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pgNum) => (
              <button key={pgNum} onClick={() => setCurrentPage(pgNum)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all ${
                  currentPage === pgNum ? 'bg-ink text-white' : 'border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50'
                }`}>
                {pgNum}
              </button>
            ))}
            <button onClick={addPage} className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-400 hover:bg-neutral-50">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <h3 className="mb-2 mt-6 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Blocs</h3>
          <div className="space-y-1">
            {BLOCK_TYPES.map((bt) => {
              const Icon = bt.icon;
              return (
                <button key={bt.type} onClick={() => addBlock(bt.type)}
                  className="flex w-full items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-sm text-neutral-600 transition-all hover:border-neutral-200 hover:bg-white">
                  <Icon className="h-4 w-4" />
                  {bt.label}
                </button>
              );
            })}
          </div>

          <button onClick={() => setShowSettings(!showSettings)}
            className="mt-6 flex w-full items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50">
            <Layers className="h-3.5 w-3.5" />
            {showSettings ? 'Masquer les infos' : 'Infos du Cahier'}
          </button>
        </div>

        {/* Center: Page canvas */}
        <div className="flex-1 overflow-y-auto bg-neutral-100 p-8">
          <div className="mx-auto max-w-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">Page {currentPage} / {totalPages}</span>
              <div className="flex items-center gap-2">
                <select value={currentLayout} onChange={(e) => setLayout(e.target.value as PageLayout)}
                  className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-600">
                  {LAYOUTS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}
                  className="rounded p-1.5 text-neutral-400 hover:bg-neutral-200 disabled:opacity-30">
                  <ChevronUp className="h-4 w-4 rotate-[-90deg]" />
                </button>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
                  className="rounded p-1.5 text-neutral-400 hover:bg-neutral-200 disabled:opacity-30">
                  <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
                </button>
              </div>
            </div>

            <div className={`min-h-[600px] rounded-lg border border-neutral-200 bg-white p-12 shadow-sm ${
              currentLayout === '2-columns' ? 'columns-2 gap-8' : ''
            }`}>
              {pageBlocks.length === 0 && (
                <div className="flex h-[500px] flex-col items-center justify-center text-center">
                  <FileText className="h-12 w-12 text-neutral-200" strokeWidth={1.5} />
                  <p className="mt-3 text-sm text-neutral-400">Page vide</p>
                  <p className="mt-1 text-xs text-neutral-300">Ajoutez des blocs depuis la gauche</p>
                </div>
              )}

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={pageBlocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  {pageBlocks.map((block) => (
                    <SortableBlock
                      key={block.id}
                      block={block}
                      isSelected={block.id === selectedBlockId}
                      onSelect={() => setSelectedBlockId(block.id)}
                      onDelete={() => deleteBlock(block.id)}
                      onDuplicate={() => duplicateBlock(block.id)}
                      onMoveUp={() => moveBlock(block.id, 'up')}
                      onMoveDown={() => moveBlock(block.id, 'down')}
                      onUpdate={(updates) => updateBlockContent(block.id, updates)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </div>

        {/* Right: Properties */}
        <div className="w-72 shrink-0 overflow-y-auto border-l border-neutral-200 bg-white p-4">
          {showSettings ? (
            <IssueSettings issue={issue} updateIssue={updateIssue} />
          ) : selectedBlock ? (
            <BlockProperties block={selectedBlock} onUpdate={(updates) => updateBlockContent(selectedBlock.id, updates)} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Layers className="h-8 w-8 text-neutral-200" strokeWidth={1.5} />
              <p className="mt-2 text-xs text-neutral-400">Sélectionnez un bloc</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'saving') return <span className="text-xs text-neutral-400">Enregistrement...</span>;
  if (state === 'saved') return <span className="text-xs text-green-500">✓ Enregistré</span>;
  if (state === 'error') return <span className="text-xs text-red-500">⚠ Erreur</span>;
  return <span className="text-xs text-amber-500">● Modifications</span>;
}

// Sortable block wrapper
function SortableBlock({ block, isSelected, onSelect, onDelete, onDuplicate, onMoveUp, onMoveDown, onUpdate }: {
  block: PageBlock;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdate: (updates: Partial<BlockContent>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const spaceBefore = SPACE_CLASSES[block.content_json.spaceBefore ?? 'md'];
  const spaceAfter = SPACE_CLASSES[block.content_json.spaceAfter ?? 'md'];

  return (
    <div ref={setNodeRef} style={style} className={`${spaceBefore} ${spaceAfter} break-inside-avoid`}>
      <div
        onClick={onSelect}
        className={`group relative cursor-pointer rounded-lg p-3 transition-all ${
          isSelected ? 'ring-2 ring-ink' : 'hover:ring-1 hover:ring-neutral-300'
        }`}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-3 cursor-grab rounded p-0.5 text-neutral-300 opacity-0 transition-opacity hover:text-neutral-500 group-hover:opacity-100"
        >
          <ChevronUp className="h-3 w-3 rotate-45" />
        </button>

        {isSelected && (
          <div className="absolute -top-3 right-0 flex items-center gap-1 rounded-lg bg-ink px-1.5 py-1 shadow-sm">
            <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} className="rounded p-0.5 text-white hover:bg-ink/80">
              <ChevronUp className="h-3 w-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} className="rounded p-0.5 text-white hover:bg-ink/80">
              <ChevronDown className="h-3 w-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="rounded p-0.5 text-white hover:bg-ink/80">
              <Copy className="h-3 w-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="rounded p-0.5 text-white hover:bg-red-500">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}

        <BlockContentRenderer block={block} isSelected={isSelected} onUpdate={onUpdate} />
      </div>
    </div>
  );
}

// Block content renderer (edit mode)
function BlockContentRenderer({ block, isSelected, onUpdate }: {
  block: PageBlock;
  isSelected: boolean;
  onUpdate: (updates: Partial<BlockContent>) => void;
}) {
  const align = ALIGN_CLASSES[block.content_json.alignment ?? 'left'];
  const font = FONT_CLASSES[block.content_json.fontSize ?? 'base'];

  if (block.block_type === 'heading') {
    return (
      <h1 className={`font-display text-3xl font-bold text-neutral-800 ${align}`}
        contentEditable={isSelected} suppressContentEditableWarning
        onBlur={(e) => onUpdate({ text: e.currentTarget.textContent ?? '' })}>
        {block.content_json.text || 'Titre'}
      </h1>
    );
  }

  if (block.block_type === 'subheading') {
    return (
      <h2 className={`font-display text-xl font-semibold text-neutral-600 ${align}`}
        contentEditable={isSelected} suppressContentEditableWarning
        onBlur={(e) => onUpdate({ text: e.currentTarget.textContent ?? '' })}>
        {block.content_json.text || 'Sous-titre'}
      </h2>
    );
  }

  if (block.block_type === 'paragraph') {
    if (isSelected) {
      return (
        <RichTextEditor
          content={block.content_json.richContent ?? block.content_json.text ?? ''}
          onChange={(json) => onUpdate({ richContent: json })}
          editable
          className={font}
        />
      );
    }
    return (
      <div className={`${align} ${font} leading-relaxed text-neutral-700`}>
        {block.content_json.text || 'Cliquez pour écrire...'}
      </div>
    );
  }

  if (block.block_type === 'image') {
    return (
      <div className={align}>
        {block.content_json.imageUrl ? (
          <div className={`inline-block ${IMG_WIDTH_CLASSES[block.content_json.imageWidth ?? 'normal']}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={block.content_json.imageUrl} alt={block.content_json.alt ?? ''} className="max-w-full rounded-lg" />
            {block.content_json.caption && <p className="mt-2 text-xs text-neutral-400">{block.content_json.caption}</p>}
            {block.content_json.credit && <p className="text-[10px] text-neutral-300">© {block.content_json.credit}</p>}
          </div>
        ) : (
          <ImageUploadZone onUpload={(url) => onUpdate({ imageUrl: url })} />
        )}
      </div>
    );
  }

  if (block.block_type === 'quote') {
    return (
      <blockquote className={`border-l-4 border-ink pl-4 ${align}`}>
        <p className="font-display text-lg italic text-neutral-700"
          contentEditable={isSelected} suppressContentEditableWarning
          onBlur={(e) => onUpdate({ text: e.currentTarget.textContent ?? '' })}>
          {block.content_json.text || 'Citation...'}
        </p>
        {block.content_json.source && <cite className="mt-1 block text-xs text-neutral-400">— {block.content_json.source}</cite>}
      </blockquote>
    );
  }

  if (block.block_type === 'key_figure') {
    return (
      <div className={`rounded-lg bg-neutral-50 p-4 ${align}`}>
        <p className="font-display text-4xl font-bold text-ink"
          contentEditable={isSelected} suppressContentEditableWarning
          onBlur={(e) => onUpdate({ figure: e.currentTarget.textContent ?? '' })}>
          {block.content_json.figure || '0'}
        </p>
        {block.content_json.text && (
          <p className="mt-1 text-xs text-neutral-500"
            contentEditable={isSelected} suppressContentEditableWarning
            onBlur={(e) => onUpdate({ text: e.currentTarget.textContent ?? '' })}>
            {block.content_json.text}
          </p>
        )}
      </div>
    );
  }

  if (block.block_type === 'separator') {
    return <hr className="border-neutral-200" />;
  }

  if (block.block_type === 'sidebar') {
    return (
      <div className={`rounded-lg border border-neutral-200 bg-neutral-50 p-4 ${align}`}>
        <p className="text-sm font-medium text-neutral-700"
          contentEditable={isSelected} suppressContentEditableWarning
          onBlur={(e) => onUpdate({ text: e.currentTarget.textContent ?? '' })}>
          {block.content_json.text || 'Encadré...'}
        </p>
      </div>
    );
  }

  return null;
}

// Block preview (no editing)
function BlockPreview({ block }: { block: PageBlock }) {
  const align = ALIGN_CLASSES[block.content_json.alignment ?? 'left'];
  const spaceBefore = SPACE_CLASSES[block.content_json.spaceBefore ?? 'md'];
  const spaceAfter = SPACE_CLASSES[block.content_json.spaceAfter ?? 'md'];

  return (
    <div className={`${spaceBefore} ${spaceAfter}`}>
      {block.block_type === 'heading' && <h1 className={`font-display text-3xl font-bold text-neutral-800 ${align}`}>{block.content_json.text}</h1>}
      {block.block_type === 'subheading' && <h2 className={`font-display text-xl font-semibold text-neutral-600 ${align}`}>{block.content_json.text}</h2>}
      {block.block_type === 'paragraph' && <div className={`leading-relaxed text-neutral-700 ${align}`}>{block.content_json.text}</div>}
      {block.block_type === 'image' && block.content_json.imageUrl && (
        <div className={align}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.content_json.imageUrl} alt={block.content_json.alt ?? ''} className="max-w-full rounded-lg" />
          {block.content_json.caption && <p className="mt-2 text-xs text-neutral-400">{block.content_json.caption}</p>}
        </div>
      )}
      {block.block_type === 'quote' && (
        <blockquote className={`border-l-4 border-ink pl-4 ${align}`}>
          <p className="font-display text-lg italic text-neutral-700">{block.content_json.text}</p>
          {block.content_json.source && <cite className="mt-1 block text-xs text-neutral-400">— {block.content_json.source}</cite>}
        </blockquote>
      )}
      {block.block_type === 'key_figure' && (
        <div className={`rounded-lg bg-neutral-50 p-4 ${align}`}>
          <p className="font-display text-4xl font-bold text-ink">{block.content_json.figure}</p>
          {block.content_json.text && <p className="mt-1 text-xs text-neutral-500">{block.content_json.text}</p>}
        </div>
      )}
      {block.block_type === 'separator' && <hr className="border-neutral-200" />}
      {block.block_type === 'sidebar' && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-sm font-medium text-neutral-700">{block.content_json.text}</p>
        </div>
      )}
    </div>
  );
}

// Image upload zone
function ImageUploadZone({ onUpload }: { onUpload: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await fetch('/api/admin/media/upload', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
      });
      if (!resp.ok) {
        const data = await resp.json() as { error?: string };
        throw new Error(data.error ?? 'Upload échoué');
      }
      const data = await resp.json() as { url: string };
      onUpload(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
    setUploading(false);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); }}
      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50"
    >
      <div className="text-center">
        {uploading ? (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-neutral-300" />
        ) : (
          <>
            <ImageIcon className="mx-auto h-8 w-8 text-neutral-300" />
            <p className="mt-1 text-xs text-neutral-400">Glissez une image ou</p>
            <label className="mt-1 inline-block cursor-pointer text-xs font-medium text-ink hover:underline">
              sélectionner un fichier
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </label>
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}

// Block properties panel
function BlockProperties({ block, onUpdate }: {
  block: PageBlock;
  onUpdate: (updates: Partial<BlockContent>) => void;
}) {
  const inputClass = 'w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Propriétés</h3>
        <p className="mt-1 text-sm font-medium text-neutral-700">
          {BLOCK_TYPES.find((bt) => bt.type === block.block_type)?.label ?? block.block_type}
        </p>
      </div>

      {(block.block_type === 'paragraph' || block.block_type === 'heading' || block.block_type === 'subheading') && (
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">Taille</label>
          <select value={block.content_json.fontSize ?? 'base'}
            onChange={(e) => onUpdate({ fontSize: e.target.value as FontSize })} className={inputClass}>
            <option value="sm">Petit</option>
            <option value="base">Normal</option>
            <option value="lg">Grand</option>
            <option value="xl">Très grand</option>
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Alignement</label>
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((a) => (
            <button key={a} onClick={() => onUpdate({ alignment: a })}
              className={`flex-1 rounded-lg border px-2 py-1.5 text-xs ${
                (block.content_json.alignment ?? 'left') === a ? 'border-ink bg-ink text-white' : 'border-neutral-200 bg-white text-neutral-500'
              }`}>
              {a === 'left' ? 'G.' : a === 'center' ? 'C.' : 'D.'}
            </button>
          ))}
        </div>
      </div>

      {block.block_type === 'image' && (
        <>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Légende</label>
            <input type="text" value={block.content_json.caption ?? ''} onChange={(e) => onUpdate({ caption: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Crédit</label>
            <input type="text" value={block.content_json.credit ?? ''} onChange={(e) => onUpdate({ credit: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Texte alternatif</label>
            <input type="text" value={block.content_json.alt ?? ''} onChange={(e) => onUpdate({ alt: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Largeur</label>
            <select value={block.content_json.imageWidth ?? 'normal'}
              onChange={(e) => onUpdate({ imageWidth: e.target.value as ImageWidth })} className={inputClass}>
              <option value="normal">Normal</option>
              <option value="wide">Large</option>
              <option value="full">Pleine largeur</option>
            </select>
          </div>
        </>
      )}

      {block.block_type === 'quote' && (
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">Source</label>
          <input type="text" value={block.content_json.source ?? ''} onChange={(e) => onUpdate({ source: e.target.value })} className={inputClass} />
        </div>
      )}

      {block.block_type === 'key_figure' && (
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">Valeur</label>
          <input type="text" value={block.content_json.figure ?? ''} onChange={(e) => onUpdate({ figure: e.target.value })} className={inputClass} placeholder="ex: 42%" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">Espace avant</label>
          <select value={block.content_json.spaceBefore ?? 'md'}
            onChange={(e) => onUpdate({ spaceBefore: e.target.value as BlockContent['spaceBefore'] })} className={inputClass}>
            <option value="none">Aucun</option>
            <option value="sm">Petit</option>
            <option value="md">Normal</option>
            <option value="lg">Grand</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">Espace après</label>
          <select value={block.content_json.spaceAfter ?? 'md'}
            onChange={(e) => onUpdate({ spaceAfter: e.target.value as BlockContent['spaceAfter'] })} className={inputClass}>
            <option value="none">Aucun</option>
            <option value="sm">Petit</option>
            <option value="md">Normal</option>
            <option value="lg">Grand</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// Issue settings panel
function IssueSettings({ issue, updateIssue }: {
  issue: IssueData;
  updateIssue: (field: keyof IssueData, value: string | number | boolean) => void;
}) {
  const inputClass = 'w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm';
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Informations du Cahier</h3>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Titre</label>
        <input type="text" value={issue.title} onChange={(e) => updateIssue('title', e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Sous-titre</label>
        <input type="text" value={issue.subtitle} onChange={(e) => updateIssue('subtitle', e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Thème</label>
        <input type="text" value={issue.theme} onChange={(e) => updateIssue('theme', e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Description</label>
        <textarea value={issue.description} onChange={(e) => updateIssue('description', e.target.value)} rows={3} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Date de publication</label>
        <input type="date" value={issue.publication_date} onChange={(e) => updateIssue('publication_date', e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Direction éditoriale</label>
        <input type="text" value={issue.editorial_director} onChange={(e) => updateIssue('editorial_director', e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Couverture (URL)</label>
        <input type="text" value={issue.cover_image_path} onChange={(e) => updateIssue('cover_image_path', e.target.value)} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">Prix/page (€)</label>
          <input type="text" value={issue.price_per_page} onChange={(e) => updateIssue('price_per_page', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">Prix complet (€)</label>
          <input type="text" value={issue.full_download_price} onChange={(e) => updateIssue('full_download_price', e.target.value)} className={inputClass} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Pages gratuites</label>
        <input type="number" value={issue.free_pages_count} onChange={(e) => updateIssue('free_pages_count', parseInt(e.target.value) || 0)} className={inputClass} min={0} />
      </div>
      <label className="flex items-center gap-2 text-sm text-neutral-600">
        <input type="checkbox" checked={issue.download_enabled} onChange={(e) => updateIssue('download_enabled', e.target.checked)} className="h-4 w-4 accent-ink" />
        Téléchargement PDF activé
      </label>
    </div>
  );
}
