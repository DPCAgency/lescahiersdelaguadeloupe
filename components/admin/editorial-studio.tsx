'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

import {
  Loader2, ArrowLeft, Save, Plus, Trash2, ChevronUp, ChevronDown,
  Type, AlignLeft, Image as ImageIcon, Quote, BarChart3, Minus,
  PanelRight, Clock, Eye, Send, Archive, FileText, Layers,
} from 'lucide-react';

interface PageBlock {
  id: string;
  page_number: number;
  block_type: string;
  position: number;
  content_json: {
    text?: string;
    imageUrl?: string;
    caption?: string;
    credit?: string;
    alignment?: 'left' | 'center' | 'right';
    fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
    color?: string;
    articleId?: string;
    figure?: string;
    source?: string;
  };
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

const BLOCK_TYPES = [
  { type: 'heading', label: 'Titre', icon: Type, color: 'text-ink' },
  { type: 'subheading', label: 'Sous-titre', icon: Type, color: 'text-neutral-600' },
  { type: 'paragraph', label: 'Texte', icon: AlignLeft, color: 'text-neutral-700' },
  { type: 'image', label: 'Image', icon: ImageIcon, color: 'text-blue-600' },
  { type: 'quote', label: 'Citation', icon: Quote, color: 'text-amber-600' },
  { type: 'key_figure', label: 'Chiffre clé', icon: BarChart3, color: 'text-green-600' },
  { type: 'separator', label: 'Séparateur', icon: Minus, color: 'text-neutral-400' },
  { type: 'sidebar', label: 'Encadré', icon: PanelRight, color: 'text-purple-600' },
  { type: 'source', label: 'Source', icon: FileText, color: 'text-neutral-500' },
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

export default function EditorialStudio({ issueId }: { issueId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [issue, setIssue] = useState<IssueData | null>(null);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [dirty, setDirty] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const issueResp = await fetch(`/api/admin/issues/${issueId}`, { credentials: 'same-origin' });
      if (issueResp.ok) {
        const issueData = await issueResp.json();
        setIssue({
          id: issueData.id,
          issue_number: issueData.issue_number ?? '',
          title: issueData.title ?? '',
          subtitle: issueData.subtitle ?? '',
          description: issueData.description ?? '',
          publication_date: issueData.publication_date ?? '',
          cover_image_path: issueData.cover_image_path ?? '',
          page_count: issueData.page_count ?? 1,
          status: issueData.status ?? 'draft',
          price_per_page: issueData.price_per_page?.toString() ?? '0.30',
          full_download_price: issueData.full_download_price?.toString() ?? '2.90',
          theme: issueData.theme ?? '',
          editorial_director: issueData.editorial_director ?? '',
          free_pages_count: issueData.free_pages_count ?? 1,
          download_enabled: issueData.download_enabled ?? true,
        });
      }

      const blocksResp = await fetch(`/api/admin/issues/${issueId}/blocks`, { credentials: 'same-origin' });
      if (blocksResp.ok) {
        const blockData = await blocksResp.json();
        setBlocks((blockData as Array<Record<string, unknown>>).map((b) => ({
          id: b.id as string,
          page_number: b.page_number as number,
          block_type: b.block_type as string,
          position: b.position as number,
          content_json: (b.content_json ?? {}) as PageBlock['content_json'],
        })));
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

  const markDirty = useCallback(() => {
    setDirty(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { saveAll(); }, 3000);
  }, []);

  const addBlock = (blockType: string) => {
    const newPos = pageBlocks.length > 0 ? Math.max(...pageBlocks.map((b) => b.position)) + 1 : 0;
    const newBlock: PageBlock = {
      id: `temp-${Date.now()}`,
      page_number: currentPage,
      block_type: blockType,
      position: newPos,
      content_json: {},
    };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
    markDirty();
  };

  const updateBlockContent = (blockId: string, updates: Partial<PageBlock['content_json']>) => {
    setBlocks((prev) => prev.map((b) =>
      b.id === blockId ? { ...b, content_json: { ...b.content_json, ...updates } } : b
    ));
    markDirty();
  };

  const deleteBlock = (blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    if (selectedBlockId === blockId) setSelectedBlockId(null);
    markDirty();
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const sorted = [...pageBlocks];
    const idx = sorted.findIndex((b) => b.id === blockId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const blockA = sorted[idx];
    const blockB = sorted[swapIdx];
    const tempPos = blockA.position;
    blockA.position = blockB.position;
    blockB.position = tempPos;

    setBlocks((prev) => prev.map((b) => {
      if (b.id === blockA.id) return { ...b, position: blockA.position };
      if (b.id === blockB.id) return { ...b, position: blockB.position };
      return b;
    }));
    markDirty();
  };

  const addPage = () => {
    if (!issue) return;
    const newPageCount = totalPages + 1;
    setIssue({ ...issue, page_count: newPageCount });
    setCurrentPage(newPageCount);
    markDirty();
  };

  const updateIssue = (field: keyof IssueData, value: string | number | boolean) => {
    setIssue((prev) => prev ? { ...prev, [field]: value } : null);
    markDirty();
  };

  const saveAll = useCallback(async () => {
    if (!issue) return;
    setSaving(true);
    setDirty(false);
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

      for (const block of blocks) {
        if (block.id.startsWith('temp-')) {
          const resp = await fetch(`/api/admin/issues/${issueId}/blocks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
              page_number: block.page_number,
              block_type: block.block_type,
              position: block.position,
              content_json: block.content_json,
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
              content_json: block.content_json,
            }),
          });
        }
      }
    } catch (err) {
      console.error('Save error:', err);
    }
    setSaving(false);
  }, [issue, blocks, issueId]);

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

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/cahiers')} className="rounded-lg border border-neutral-200 p-2 text-neutral-500 hover:bg-neutral-50">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="font-display text-lg font-bold text-neutral-800">
              {issue.title || 'Sans titre'}
            </h2>
            <p className="text-xs text-neutral-400">N°{issue.issue_number}</p>
          </div>
          {dirty && <span className="text-xs text-amber-500">Modifications non enregistrées</span>}
          {saving && <span className="text-xs text-neutral-400">Enregistrement...</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[issue.status]}`}>
            {STATUS_OPTIONS.find((s) => s.value === issue.status)?.label ?? issue.status}
          </span>
          <select
            value={issue.status}
            onChange={(e) => changeStatus(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button onClick={saveAll} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white hover:bg-ink/90 disabled:opacity-50">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Enregistrer
          </button>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Block library */}
        <div className="w-56 shrink-0 overflow-y-auto border-r border-neutral-200 bg-neutral-50 p-3">
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Bibliothèque de blocs</h3>
          <div className="space-y-1">
            {BLOCK_TYPES.map((bt) => {
              const Icon = bt.icon;
              return (
                <button
                  key={bt.type}
                  onClick={() => addBlock(bt.type)}
                  className="flex w-full items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-sm text-neutral-600 transition-all hover:border-neutral-200 hover:bg-white"
                >
                  <Icon className={`h-4 w-4 ${bt.color}`} />
                  {bt.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6 border-t border-neutral-200 pt-4">
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Pages</h3>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pgNum) => (
                <button
                  key={pgNum}
                  onClick={() => setCurrentPage(pgNum)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all ${
                    currentPage === pgNum
                      ? 'bg-ink text-white'
                      : 'border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  {pgNum}
                </button>
              ))}
              <button onClick={addPage} className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-400 hover:bg-neutral-50">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="mt-6 flex w-full items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
          >
            <Layers className="h-3.5 w-3.5" />
            {showSettings ? 'Masquer les infos' : 'Infos du Cahier'}
          </button>
        </div>

        {/* Center: Page canvas */}
        <div className="flex-1 overflow-y-auto bg-neutral-100 p-8">
          <div className="mx-auto max-w-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">Page {currentPage} / {totalPages}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="rounded p-1.5 text-neutral-400 hover:bg-neutral-200 disabled:opacity-30">
                  <ChevronUp className="h-4 w-4 rotate-[-90deg]" />
                </button>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="rounded p-1.5 text-neutral-400 hover:bg-neutral-200 disabled:opacity-30">
                  <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
                </button>
              </div>
            </div>

            {/* Page */}
            <div className="min-h-[600px] rounded-lg border border-neutral-200 bg-white p-12 shadow-sm">
              {pageBlocks.length === 0 && (
                <div className="flex h-[500px] flex-col items-center justify-center text-center">
                  <FileText className="h-12 w-12 text-neutral-200" strokeWidth={1.5} />
                  <p className="mt-3 text-sm text-neutral-400">Page vide</p>
                  <p className="mt-1 text-xs text-neutral-300">Ajoutez des blocs depuis la bibliothèque à gauche</p>
                </div>
              )}

              {pageBlocks.map((block) => (
                <BlockRenderer
                  key={block.id}
                  block={block}
                  isSelected={block.id === selectedBlockId}
                  onSelect={() => setSelectedBlockId(block.id)}
                  onDelete={() => deleteBlock(block.id)}
                  onMoveUp={() => moveBlock(block.id, 'up')}
                  onMoveDown={() => moveBlock(block.id, 'down')}
                  onUpdate={(updates) => updateBlockContent(block.id, updates)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Properties panel */}
        <div className="w-72 shrink-0 overflow-y-auto border-l border-neutral-200 bg-white p-4">
          {showSettings ? (
            <IssueSettings issue={issue} updateIssue={updateIssue} />
          ) : selectedBlock ? (
            <BlockProperties block={selectedBlock} onUpdate={(updates) => updateBlockContent(selectedBlock.id, updates)} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Layers className="h-8 w-8 text-neutral-200" strokeWidth={1.5} />
              <p className="mt-2 text-xs text-neutral-400">Sélectionnez un bloc pour modifier ses propriétés</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Block renderer
function BlockRenderer({ block, isSelected, onSelect, onDelete, onMoveUp, onMoveDown, onUpdate }: {
  block: PageBlock;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdate: (updates: Partial<PageBlock['content_json']>) => void;
}) {
  const alignClass = block.content_json.alignment === 'center' ? 'text-center' : block.content_json.alignment === 'right' ? 'text-right' : 'text-left';
  const fontSizeClass = {
    sm: 'text-sm', base: 'text-base', lg: 'text-lg', xl: 'text-xl', '2xl': 'text-2xl', '3xl': 'text-3xl',
  }[block.content_json.fontSize ?? 'base'];

  return (
    <div
      onClick={onSelect}
      className={`group relative cursor-pointer rounded-lg p-3 transition-all ${
        isSelected ? 'ring-2 ring-ink' : 'hover:ring-1 hover:ring-neutral-300'
      }`}
    >
      {isSelected && (
        <div className="absolute -top-3 right-0 flex items-center gap-1 rounded-lg bg-ink px-1.5 py-1 shadow-sm">
          <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} className="rounded p-0.5 text-white hover:bg-ink/80">
            <ChevronUp className="h-3 w-3" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} className="rounded p-0.5 text-white hover:bg-ink/80">
            <ChevronDown className="h-3 w-3" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="rounded p-0.5 text-white hover:bg-red-500">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}

      {block.block_type === 'heading' && (
        <h1 className={`font-display text-3xl font-bold text-neutral-800 ${alignClass}`}
          contentEditable={isSelected}
          suppressContentEditableWarning
          onBlur={(e) => onUpdate({ text: e.currentTarget.textContent ?? '' })}
        >
          {block.content_json.text || 'Titre'}
        </h1>
      )}

      {block.block_type === 'subheading' && (
        <h2 className={`font-display text-xl font-semibold text-neutral-600 ${alignClass}`}
          contentEditable={isSelected}
          suppressContentEditableWarning
          onBlur={(e) => onUpdate({ text: e.currentTarget.textContent ?? '' })}
        >
          {block.content_json.text || 'Sous-titre'}
        </h2>
      )}

      {block.block_type === 'paragraph' && (
        <p className={`leading-relaxed text-neutral-700 ${alignClass} ${fontSizeClass}`}
          contentEditable={isSelected}
          suppressContentEditableWarning
          onBlur={(e) => onUpdate({ text: e.currentTarget.textContent ?? '' })}
        >
          {block.content_json.text || 'Cliquez pour écrire du texte...'}
        </p>
      )}

      {block.block_type === 'image' && (
        <div className={alignClass}>
          {block.content_json.imageUrl ? (
            <div className="inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={block.content_json.imageUrl} alt={block.content_json.caption ?? ''} className="max-w-full rounded-lg" />
              {block.content_json.caption && (
                <p className="mt-2 text-xs text-neutral-400">{block.content_json.caption}</p>
              )}
              {block.content_json.credit && (
                <p className="text-[10px] text-neutral-300">© {block.content_json.credit}</p>
              )}
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50">
              <div className="text-center">
                <ImageIcon className="mx-auto h-8 w-8 text-neutral-300" />
                <p className="mt-1 text-xs text-neutral-400">Ajoutez une URL d'image dans les propriétés</p>
              </div>
            </div>
          )}
        </div>
      )}

      {block.block_type === 'quote' && (
        <blockquote className={`border-l-4 border-ink pl-4 ${alignClass}`}>
          <p className="font-display text-lg italic text-neutral-700"
            contentEditable={isSelected}
            suppressContentEditableWarning
            onBlur={(e) => onUpdate({ text: e.currentTarget.textContent ?? '' })}
          >
            {block.content_json.text || 'Citation...'}
          </p>
          {block.content_json.source && (
            <cite className="mt-1 block text-xs text-neutral-400">— {block.content_json.source}</cite>
          )}
        </blockquote>
      )}

      {block.block_type === 'key_figure' && (
        <div className={`rounded-lg bg-neutral-50 p-4 ${alignClass}`}>
          <p className="font-display text-4xl font-bold text-ink"
            contentEditable={isSelected}
            suppressContentEditableWarning
            onBlur={(e) => onUpdate({ figure: e.currentTarget.textContent ?? '' })}
          >
            {block.content_json.figure || '0'}
          </p>
          {block.content_json.text && (
            <p className="mt-1 text-xs text-neutral-500"
              contentEditable={isSelected}
              suppressContentEditableWarning
              onBlur={(e) => onUpdate({ text: e.currentTarget.textContent ?? '' })}
            >
              {block.content_json.text}
            </p>
          )}
        </div>
      )}

      {block.block_type === 'separator' && (
        <hr className="border-neutral-200" />
      )}

      {block.block_type === 'sidebar' && (
        <div className={`rounded-lg border border-neutral-200 bg-neutral-50 p-4 ${alignClass}`}>
          <p className="text-sm font-medium text-neutral-700"
            contentEditable={isSelected}
            suppressContentEditableWarning
            onBlur={(e) => onUpdate({ text: e.currentTarget.textContent ?? '' })}
          >
            {block.content_json.text || 'Encadré...'}
          </p>
        </div>
      )}

      {block.block_type === 'source' && (
        <p className={`text-xs text-neutral-400 ${alignClass}`}
          contentEditable={isSelected}
          suppressContentEditableWarning
          onBlur={(e) => onUpdate({ text: e.currentTarget.textContent ?? '' })}
        >
          Source: {block.content_json.text || 'À préciser'}
        </p>
      )}
    </div>
  );
}

// Block properties panel
function BlockProperties({ block, onUpdate }: {
  block: PageBlock;
  onUpdate: (updates: Partial<PageBlock['content_json']>) => void;
}) {
  const inputClass = 'w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Propriétés du bloc</h3>
        <p className="mt-1 text-sm font-medium text-neutral-700">
          {BLOCK_TYPES.find((bt) => bt.type === block.block_type)?.label ?? block.block_type}
        </p>
      </div>

      {(block.block_type === 'paragraph' || block.block_type === 'heading' || block.block_type === 'subheading') && (
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">Taille du texte</label>
          <select
            value={block.content_json.fontSize ?? 'base'}
            onChange={(e) => onUpdate({ fontSize: e.target.value as PageBlock['content_json']['fontSize'] })}
            className={inputClass}
          >
            <option value="sm">Petit</option>
            <option value="base">Normal</option>
            <option value="lg">Grand</option>
            <option value="xl">Très grand</option>
            <option value="2xl">Énorme</option>
            <option value="3xl">Maximal</option>
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Alignement</label>
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              onClick={() => onUpdate({ alignment: align })}
              className={`flex-1 rounded-lg border px-2 py-1.5 text-xs ${
                (block.content_json.alignment ?? 'left') === align
                  ? 'border-ink bg-ink text-white'
                  : 'border-neutral-200 bg-white text-neutral-500'
              }`}
            >
              {align === 'left' ? 'Gauche' : align === 'center' ? 'Centre' : 'Droite'}
            </button>
          ))}
        </div>
      </div>

      {block.block_type === 'image' && (
        <>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">URL de l'image</label>
            <input
              type="text"
              value={block.content_json.imageUrl ?? ''}
              onChange={(e) => onUpdate({ imageUrl: e.target.value })}
              className={inputClass}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Légende</label>
            <input
              type="text"
              value={block.content_json.caption ?? ''}
              onChange={(e) => onUpdate({ caption: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Crédit</label>
            <input
              type="text"
              value={block.content_json.credit ?? ''}
              onChange={(e) => onUpdate({ credit: e.target.value })}
              className={inputClass}
            />
          </div>
        </>
      )}

      {block.block_type === 'quote' && (
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">Source</label>
          <input
            type="text"
            value={block.content_json.source ?? ''}
            onChange={(e) => onUpdate({ source: e.target.value })}
            className={inputClass}
          />
        </div>
      )}

      {block.block_type === 'key_figure' && (
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">Valeur</label>
          <input
            type="text"
            value={block.content_json.figure ?? ''}
            onChange={(e) => onUpdate({ figure: e.target.value })}
            className={inputClass}
            placeholder="ex: 42%"
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-500">Lien vers article</label>
        <input
          type="text"
          value={block.content_json.articleId ?? ''}
          onChange={(e) => onUpdate({ articleId: e.target.value })}
          className={inputClass}
          placeholder="ID de l'article (optionnel)"
        />
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
        <label className="mb-1 block text-xs font-medium text-neutral-500">Thème principal</label>
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
        <label className="mb-1 block text-xs font-medium text-neutral-500">Image de couverture (URL)</label>
        <input type="text" value={issue.cover_image_path} onChange={(e) => updateIssue('cover_image_path', e.target.value)} className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">Prix par page (€)</label>
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
