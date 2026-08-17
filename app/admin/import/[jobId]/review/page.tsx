'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';

import {
  Loader2,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Save,
  FileText,
  Layers,
  CheckCircle2,
  AlertTriangle,
  CircleSlash,
  Package,
  Plus,
  Trash2,
  Merge,
  Split,
  Crop,
} from 'lucide-react';
import { safeJsonFetch } from '@/lib/utils/safe-fetch';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ExtractedBlock {
  id: string;
  page_number: number;
  type: string;
  source_text: string | null;
  edited_text: string | null;
  bounding_box_json: BoundingBox | null;
  confidence: number;
  asset_path: string | null;
  status: string;
}

interface ImportJob {
  id: string;
  source_file_path: string;
  source_type: string;
  status: string;
  page_count: number | null;
  error_message: string | null;
  metadata_json: {
    rendered_pages?: { pageNumber: number; thumbnail: string; preview: string; full: string }[];
  } | null;
}

interface ArticleSuggestion {
  id: string;
  suggestion_json: {
    title: string;
    pageRange: string;
    blockIndices: number[];
    proposedFormat: string;
    proposedCategory: string;
    proposedHeroImage?: string;
  };
  status: string;
}

const blockTypes = [
  { value: 'heading', label: 'Titre' },
  { value: 'subheading', label: 'Sous-titre' },
  { value: 'paragraph', label: 'Paragraphe' },
  { value: 'image', label: 'Image' },
  { value: 'caption', label: 'Légende' },
  { value: 'quote', label: 'Citation' },
  { value: 'key_figure', label: 'Chiffre clé' },
  { value: 'timeline', label: 'Chronologie' },
  { value: 'sidebar', label: 'Encadré' },
  { value: 'footer', label: 'Pied de page' },
  { value: 'unknown', label: 'Inconnu' },
];

const editorialTypes = ['fact', 'testimony', 'analysis', 'open_question', 'hypothesis'];

function confidenceColor(conf: number): string {
  if (conf >= 0.9) return 'text-green-600';
  if (conf >= 0.7) return 'text-amber-600';
  return 'text-red-600';
}

function confidenceLabel(conf: number): string {
  if (conf >= 0.9) return 'Haute confiance';
  if (conf >= 0.7) return 'À vérifier';
  return 'Vérification recommandée';
}

function statusIcon(status: string) {
  if (status === 'validated') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (status === 'modified') return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  if (status === 'ignored') return <CircleSlash className="h-4 w-4 text-neutral-400" />;
  return <div className="h-4 w-4 rounded-full border-2 border-neutral-200" />;
}

interface ArticleGroup {
  id: string;
  title: string;
  format: string;
  categorySlug: string;
  heroImagePath?: string;
  pageStart: number;
  pageEnd: number;
  blockIds: string[];
}

export default function ImportReviewPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<ImportJob | null>(null);
  const [blocks, setBlocks] = useState<ExtractedBlock[]>([]);
  const [suggestions, setSuggestions] = useState<ArticleSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editType, setEditType] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);
  const [showGrouping, setShowGrouping] = useState(false);
  const [groups, setGroups] = useState<ArticleGroup[]>([]);
  const [creatingArticles, setCreatingArticles] = useState(false);
  const [issueIdForArticles, setIssueIdForArticles] = useState<string>('');
  const [availableIssues, setAvailableIssues] = useState<{ id: string; title: string; issue_number: string }[]>([]);
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeSelection, setMergeSelection] = useState<string[]>([]);
  const [splitPoint, setSplitPoint] = useState<number | null>(null);
  const [pageImageUrl, setPageImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [cropModal, setCropModal] = useState<{ blockId: string; pageNum: number } | null>(null);
  const [cropBox, setCropBox] = useState<BoundingBox>({ x: 0, y: 0, width: 0.5, height: 0.5 });
  const [cropSaving, setCropSaving] = useState(false);
  const [cropFullImageUrl, setCropFullImageUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const jobResult = await safeJsonFetch(`/api/import/jobs/${jobId}`, { credentials: 'same-origin' });
      if (jobResult.ok) {
        setJob(jobResult.data as ImportJob);
      }

      const reviewResult = await safeJsonFetch(`/api/import/jobs/${jobId}/review`, { credentials: 'same-origin' });
      if (reviewResult.ok) {
        const reviewData = reviewResult.data as {
          blocks: ExtractedBlock[];
          suggestions: ArticleSuggestion[];
          issues: { id: string; title: string; issue_number: string }[];
        };
        setBlocks(reviewData.blocks ?? []);
        setSuggestions(reviewData.suggestions ?? []);
        setAvailableIssues(reviewData.issues ?? []);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  const pages = useMemo(() => {
    const set = new Set<number>();
    blocks.forEach((b) => set.add(b.page_number));
    return Array.from(set).sort((a, b) => a - b);
  }, [blocks]);

  const pageBlocks = useMemo(() => blocks.filter((b) => b.page_number === currentPage), [blocks, currentPage]);

  const selectedBlock = useMemo(() => blocks.find((b) => b.id === selectedBlockId), [blocks, selectedBlockId]);

  useEffect(() => {
    if (selectedBlock) {
      setEditText(selectedBlock.edited_text ?? selectedBlock.source_text ?? '');
      setEditType(selectedBlock.type);
      setSplitPoint(null);
    }
  }, [selectedBlock]);

  useEffect(() => {
    async function loadPageImage() {
      if (!job?.source_file_path) {
        setPageImageUrl(null);
        return;
      }
      setImageLoading(true);
      try {
        const resp = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/storage-admin?action=download`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ path: job.source_file_path }),
        });
        if (resp.ok) {
          const blob = await resp.blob();
          setPageImageUrl(URL.createObjectURL(blob));
        } else {
          setPageImageUrl(null);
        }
      } catch {
        setPageImageUrl(null);
      }
      setImageLoading(false);
    }
    loadPageImage();
  }, [job?.source_file_path]);

  const openCropModal = useCallback(async (block: ExtractedBlock) => {
    setCropModal({ blockId: block.id, pageNum: block.page_number });
    if (block.bounding_box_json) {
      setCropBox(block.bounding_box_json);
    } else {
      setCropBox({ x: 0.1, y: 0.1, width: 0.5, height: 0.5 });
    }
  }, [job]);

  const handleRecrop = async () => {
    if (!cropModal) return;
    setCropSaving(true);
    try {
      const result = await safeJsonFetch('/api/import/recrop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, blockId: cropModal.blockId, boundingBox: cropBox }),
      });
      const data = result.data as { success?: boolean; error?: string };
      if (!result.ok || !data.success) throw new Error(data.error ?? result.error ?? 'Erreur');
      setBlocks((prev) => prev.map((b) => b.id === cropModal.blockId ? { ...b, bounding_box_json: cropBox, status: 'modified' } as ExtractedBlock : b));
      setCropModal(null);
      setCropFullImageUrl(null);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    } catch (err) {
      alert(`Erreur: ${err instanceof Error ? err.message : 'Inconnue'}`);
    }
    setCropSaving(false);
  };

  const stats = useMemo(() => {
    const validated = blocks.filter((b) => b.status === 'validated').length;
    const modified = blocks.filter((b) => b.status === 'modified').length;
    const ignored = blocks.filter((b) => b.status === 'ignored').length;
    const pending = blocks.filter((b) => b.status === 'pending').length;
    const lowConf = blocks.filter((b) => b.confidence < 0.7).length;
    return { total: blocks.length, validated, modified, ignored, pending, lowConf };
  }, [blocks]);

  const pageStats = useMemo(() => {
    const pBlocks = blocks.filter((b) => b.page_number === currentPage);
    const validated = pBlocks.filter((b) => b.status === 'validated' || b.status === 'modified' || b.status === 'ignored').length;
    return { total: pBlocks.length, validated };
  }, [blocks, currentPage]);

  const autoSave = useCallback(async (blockId: string, updates: Record<string, unknown>) => {
    const updatesObj: Record<string, unknown> = {};
    if (updates.status) updatesObj.status = updates.status;
    if (updates.edited_text !== undefined) updatesObj.edited_text = updates.edited_text;
    if (updates.type) updatesObj.type = updates.type;
    if (updates.bounding_box_json) updatesObj.bounding_box_json = updates.bounding_box_json;
    if (updates.asset_path) updatesObj.asset_path = updates.asset_path;
    await fetch('/api/import/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ action: 'update_block', blockId, updates: updatesObj }),
    });
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, ...updates } as ExtractedBlock : b)));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  }, []);

  const handleValidate = (blockId: string) => {
    autoSave(blockId, { status: 'validated' });
  };

  const handleModify = (blockId: string) => {
    autoSave(blockId, { status: 'modified', edited_text: editText, type: editType });
  };

  const handleIgnore = (blockId: string) => {
    autoSave(blockId, { status: 'ignored' });
  };

  const handleTypeChange = (blockId: string, newType: string) => {
    setEditType(newType);
    autoSave(blockId, { type: newType, status: 'modified' });
  };

  const validatePage = () => {
    pageBlocks.forEach((b) => {
      if (b.status === 'pending') {
        autoSave(b.id, { status: 'validated' });
      }
    });
  };

  const allPagesValidated = pages.every((pageNum) => {
    const pBlocks = blocks.filter((b) => b.page_number === pageNum);
    return pBlocks.every((b) => b.status !== 'pending');
  });

  const validateImport = async () => {
    await fetch('/api/import/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ action: 'update_job_status', jobId, status: 'validated', progress: 100 }),
    });
    initGroupsFromSuggestions();
    setShowGrouping(true);
  };

  const initGroupsFromSuggestions = () => {
    const allBlocks = blocks;
    const newGroups: ArticleGroup[] = suggestions.map((sugg, i) => {
      const blockIds = sugg.suggestion_json.blockIndices
        .map((idx) => allBlocks[idx]?.id)
        .filter(Boolean) as string[];
      const groupPages = blockIds
        .map((bid) => allBlocks.find((b) => b.id === bid)?.page_number ?? 1)
        .sort((a, b) => a - b);
      return {
        id: `group-${i}`,
        title: sugg.suggestion_json.title,
        format: sugg.suggestion_json.proposedFormat,
        categorySlug: sugg.suggestion_json.proposedCategory,
        heroImagePath: sugg.suggestion_json.proposedHeroImage,
        pageStart: groupPages[0] ?? 1,
        pageEnd: groupPages[groupPages.length - 1] ?? 1,
        blockIds,
      };
    });
    setGroups(newGroups);
  };

  const addGroup = () => {
    setGroups([...groups, {
      id: `group-${Date.now()}`,
      title: 'Nouvel article',
      format: 'analyse',
      categorySlug: 'politique-institutions',
      pageStart: 1,
      pageEnd: 1,
      blockIds: [],
    }]);
  };

  const removeGroup = (id: string) => {
    setGroups(groups.filter((g) => g.id !== id));
  };

  const updateGroup = (id: string, field: keyof ArticleGroup, value: unknown) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  };

  const addBlockToGroup = (groupId: string, blockId: string) => {
    setGroups((prev) => prev.map((g) => {
      if (g.id !== groupId) return g;
      if (g.blockIds.includes(blockId)) return g;
      return { ...g, blockIds: [...g.blockIds, blockId] };
    }));
  };

  const removeBlockFromGroup = (groupId: string, blockId: string) => {
    setGroups((prev) => prev.map((g) =>
      g.id === groupId ? { ...g, blockIds: g.blockIds.filter((bid) => bid !== blockId) } : g
    ));
  };

  const moveBlockInGroup = (groupId: string, blockId: string, direction: 'up' | 'down') => {
    setGroups((prev) => prev.map((g) => {
      if (g.id !== groupId) return g;
      const idx = g.blockIds.indexOf(blockId);
      if (idx < 0) return g;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= g.blockIds.length) return g;
      const newIds = [...g.blockIds];
      [newIds[idx], newIds[swapIdx]] = [newIds[swapIdx], newIds[idx]];
      return { ...g, blockIds: newIds };
    }));
  };

  const handleMerge = async () => {
    if (mergeSelection.length < 2) return;
    const mergeBlocks = blocks.filter((b) => mergeSelection.includes(b.id));
    const combinedText = mergeBlocks.map((b) => b.edited_text ?? b.source_text ?? '').join('\n\n');
    const firstBlock = mergeBlocks[0];
    await autoSave(firstBlock.id, {
      status: 'modified',
      edited_text: combinedText,
      type: 'paragraph',
    });
    for (let i = 1; i < mergeBlocks.length; i++) {
      await autoSave(mergeBlocks[i].id, { status: 'ignored' });
    }
    setMergeMode(false);
    setMergeSelection([]);
  };

  const handleSplit = async () => {
    if (!selectedBlock || splitPoint === null) return;
    const text = editText;
    const part1 = text.slice(0, splitPoint).trim();
    const part2 = text.slice(splitPoint).trim();
    await autoSave(selectedBlock.id, {
      status: 'modified',
      edited_text: part1,
      type: editType,
    });
    const blockResult = await safeJsonFetch('/api/import/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        action: 'create_block',
        block: {
          p_import_job_id: jobId,
          p_page_number: selectedBlock.page_number,
          p_type: editType,
          p_source_text: selectedBlock.source_text,
          p_edited_text: part2,
          p_bounding_box_json: selectedBlock.bounding_box_json,
          p_confidence: selectedBlock.confidence,
          p_status: 'modified',
        },
      }),
    });
    const blockData = blockResult.data as { success?: boolean; block?: { id: string }; error?: string };
    if (blockData.success && blockData.block) {
      setBlocks((prev) => {
        const idx = prev.findIndex((b) => b.id === selectedBlock.id);
        const newBlockData: ExtractedBlock = {
          id: blockData.block!.id,
          page_number: selectedBlock.page_number,
          type: editType,
          source_text: selectedBlock.source_text,
          edited_text: part2,
          bounding_box_json: selectedBlock.bounding_box_json,
          confidence: selectedBlock.confidence,
          asset_path: selectedBlock.asset_path,
          status: 'modified',
        };
        const next = [...prev];
        next.splice(idx + 1, 0, newBlockData);
        return next;
      });
    }
    setSplitPoint(null);
  };

  const createArticles = async () => {
    if (!issueIdForArticles) {
      alert('Veuillez sélectionner un Cahier à associer.');
      return;
    }
    setCreatingArticles(true);
    try {
      const result = await safeJsonFetch('/api/import/create-articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          issueId: issueIdForArticles,
          groups: groups.map((g) => ({
            title: g.title,
            format: g.format,
            categorySlug: g.categorySlug,
            heroImagePath: g.heroImagePath,
            pageStart: g.pageStart,
            pageEnd: g.pageEnd,
            blockIds: g.blockIds,
          })),
        }),
      });
      const data = result.data as { success?: boolean; error?: string; created?: { articleId: string; title: string }[] };
      if (!result.ok || !data.success) {
        throw new Error(data.error ?? result.error ?? 'Erreur');
      }
      alert(`${data.created?.length ?? 0} article(s) brouillon(s) créé(s). Vous pouvez les éditer dans /admin/articles.`);
      router.push('/admin/articles');
    } catch (err) {
      alert(`Erreur: ${err instanceof Error ? err.message : 'Inconnue'}`);
    }
    setCreatingArticles(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.push('/admin/import')} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <p className="text-sm text-neutral-400">Import introuvable.</p>
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/import')} className="rounded-lg border border-neutral-200 bg-white p-2 text-neutral-500 hover:bg-neutral-50">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="font-display text-2xl font-bold text-neutral-800">Analyse incomplète</h2>
            <p className="mt-1 text-sm text-neutral-500">{job.source_file_path.split('/').pop()}</p>
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <p className="text-sm font-medium text-amber-700">Aucun bloc extrait</p>
          </div>
          <p className="mt-2 text-sm text-amber-600">
            L'analyse n'a produit aucun bloc éditorial. Cela indique un échec du pipeline
            (rendu PDF ou analyse IA). Relancez l'analyse pour réessayer.
          </p>
          {job.error_message && (
            <p className="mt-2 rounded bg-amber-100 p-2 font-mono text-xs text-amber-700">{job.error_message}</p>
          )}
          <button
            onClick={() => router.push(`/admin/import/${jobId}`)}
            className="mt-4 flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            <AlertTriangle className="h-4 w-4" />
            Relancer l'analyse
          </button>
        </div>
      </div>
    );
  }

  if (showGrouping) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/import')} className="rounded-lg border border-neutral-200 bg-white p-2 text-neutral-500 hover:bg-neutral-50">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="font-display text-2xl font-bold text-neutral-800">Articles potentiels</h2>
            <p className="mt-1 text-sm text-neutral-500">Modifiez les regroupements puis créez les brouillons d'articles.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={addGroup} className="flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white hover:bg-ink/90">
            <Plus className="h-4 w-4" /> Nouvel article potentiel
          </button>
        </div>

        <div className="space-y-4">
          {groups.map((group, gi) => (
            <div key={group.id} className="rounded-lg border border-neutral-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-7 w-7 items-center justify-center rounded bg-ink text-xs font-bold text-white">{gi + 1}</span>
                <button onClick={() => removeGroup(group.id)} className="rounded p-1.5 text-red-400 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="text-[10px] font-medium uppercase text-neutral-400">Titre</label>
                  <input type="text" value={group.title} onChange={(e) => updateGroup(group.id, 'title', e.target.value)} className="mt-1 w-full rounded border border-neutral-200 px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-medium uppercase text-neutral-400">Format</label>
                  <select value={group.format} onChange={(e) => updateGroup(group.id, 'format', e.target.value)} className="mt-1 w-full rounded border border-neutral-200 px-2 py-1.5 text-sm">
                    <option value="enquete">Enquête</option>
                    <option value="analyse">Analyse</option>
                    <option value="decryptage">Décryptage</option>
                    <option value="chronologie">Chronologie</option>
                    <option value="tribune">Tribune</option>
                    <option value="reportage">Reportage</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-medium uppercase text-neutral-400">Rubrique</label>
                  <select value={group.categorySlug} onChange={(e) => updateGroup(group.id, 'categorySlug', e.target.value)} className="mt-1 w-full rounded border border-neutral-200 px-2 py-1.5 text-sm">
                    <option value="politique-institutions">Politique & Institutions</option>
                    <option value="economie">Économie</option>
                    <option value="societe">Société</option>
                    <option value="environnement">Environnement</option>
                    <option value="culture">Culture</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <label className="text-[10px] font-medium uppercase text-neutral-400">Page début</label>
                    <input type="number" value={group.pageStart} onChange={(e) => updateGroup(group.id, 'pageStart', parseInt(e.target.value) || 1)} className="mt-1 w-20 rounded border border-neutral-200 px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium uppercase text-neutral-400">Page fin</label>
                    <input type="number" value={group.pageEnd} onChange={(e) => updateGroup(group.id, 'pageEnd', parseInt(e.target.value) || 1)} className="mt-1 w-20 rounded border border-neutral-200 px-2 py-1.5 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-medium uppercase text-neutral-400">Image principale</label>
                  <input type="text" value={group.heroImagePath ?? ''} onChange={(e) => updateGroup(group.id, 'heroImagePath', e.target.value)} className="mt-1 w-full rounded border border-neutral-200 px-2 py-1.5 text-xs" placeholder="optionnel" />
                </div>
              </div>

              <div className="mt-3">
                <p className="text-[10px] font-medium uppercase text-neutral-400">Blocs inclus ({group.blockIds.length})</p>
                <div className="mt-2 space-y-1">
                  {group.blockIds.map((blockId, bi) => {
                    const block = blocks.find((b) => b.id === blockId);
                    if (!block) return null;
                    return (
                      <div key={blockId} className="flex items-center gap-2 rounded border border-neutral-100 bg-neutral-50 px-2 py-1.5">
                        <span className="text-[10px] text-neutral-400">P{block.page_number}</span>
                        <span className="text-xs font-medium text-neutral-600">{block.type}</span>
                        <span className="flex-1 truncate text-xs text-neutral-400">{(block.edited_text ?? block.source_text ?? '').slice(0, 60)}</span>
                        <button onClick={() => moveBlockInGroup(group.id, blockId, 'up')} disabled={bi === 0} className="rounded p-0.5 text-neutral-400 hover:bg-neutral-200 disabled:opacity-30">
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button onClick={() => moveBlockInGroup(group.id, blockId, 'down')} disabled={bi === group.blockIds.length - 1} className="rounded p-0.5 text-neutral-400 hover:bg-neutral-200 disabled:opacity-30">
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        <button onClick={() => removeBlockFromGroup(group.id, blockId)} className="rounded p-0.5 text-red-400 hover:bg-red-50">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                  {group.blockIds.length === 0 && (
                    <p className="text-xs text-neutral-400">Aucun bloc. Ajoutez des blocs validés depuis la review.</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-neutral-600">Création des articles</h3>
          <p className="mt-2 text-sm text-neutral-500">
            Associez les articles à un Cahier. Les articles seront créés en statut <strong>brouillon</strong>.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <select value={issueIdForArticles} onChange={(e) => setIssueIdForArticles(e.target.value)} className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm">
              <option value="">— Sélectionner un Cahier —</option>
              {availableIssues.map((iss) => (
                <option key={iss.id} value={iss.id}>N°{iss.issue_number} — {iss.title}</option>
              ))}
            </select>
            <button
              onClick={createArticles}
              disabled={creatingArticles || !issueIdForArticles || groups.length === 0}
              className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90 disabled:opacity-50"
            >
              {creatingArticles ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
              Créer les brouillons d'articles
            </button>
          </div>
          <p className="mt-3 text-xs text-neutral-400">
            Les articles ne seront pas publiés. Ils passeront par le workflow normal de l'administration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/import')} className="rounded-lg border border-neutral-200 bg-white p-2 text-neutral-500 hover:bg-neutral-50">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="font-display text-2xl font-bold text-neutral-800">Validation de l'import</h2>
            <p className="mt-1 text-sm text-neutral-500">{job.source_file_path.split('/').pop()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {savedNotice && <span className="text-xs text-green-600">Modifications enregistrées</span>}
          {mergeMode && (
            <button
              onClick={handleMerge}
              disabled={mergeSelection.length < 2}
              className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white hover:bg-ink/90 disabled:opacity-50"
            >
              <Merge className="h-3.5 w-3.5" /> Fusionner ({mergeSelection.length})
            </button>
          )}
          <button
            onClick={() => { setMergeMode(!mergeMode); setMergeSelection([]); }}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${mergeMode ? 'border-ink bg-ink text-white' : 'border-neutral-200 bg-white text-neutral-600'}`}
          >
            <Merge className="h-3.5 w-3.5" /> {mergeMode ? 'Annuler fusion' : 'Mode fusion'}
          </button>
          {allPagesValidated ? (
            <button onClick={validateImport} className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
              <Check className="h-4 w-4" /> Valider l'import
            </button>
          ) : (
            <span className="text-xs text-neutral-400">Validez toutes les pages</span>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-xs">
        <span className="font-medium text-neutral-600">{stats.total} blocs</span>
        <span className="text-green-600">{stats.validated} validés</span>
        <span className="text-amber-600">{stats.modified} modifiés</span>
        <span className="text-neutral-400">{stats.ignored} ignorés</span>
        <span className="text-neutral-400">{stats.pending} en attente</span>
        <span className="text-red-600">{stats.lowConf} faible confiance</span>
      </div>

      {/* Split view */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left: real page image with bounding boxes */}
        <div className="rounded-lg border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-neutral-400" />
              <span className="text-sm font-medium text-neutral-600">Page {currentPage} / {job.page_count ?? pages.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 disabled:opacity-30">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setCurrentPage((p) => Math.min(job.page_count ?? pages.length, p + 1))} disabled={currentPage >= (job.page_count ?? pages.length)} className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 disabled:opacity-30">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="relative bg-neutral-100 p-4">
            <div className="relative mx-auto flex justify-center">
              {imageLoading && (
                <div className="flex h-[500px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                </div>
              )}
              {pageImageUrl && !imageLoading && (
                <div className="relative inline-block">
                  <iframe
                    src={pageImageUrl}
                    title={`Page ${currentPage}`}
                    className="h-[600px] w-full rounded border border-neutral-200 shadow-sm"
                  />
                </div>
              )}
              {!pageImageUrl && !imageLoading && (
                <div className="flex h-[500px] items-center justify-center text-sm text-neutral-400">
                  Aucun aperçu de page disponible
                </div>
              )}
            </div>
          </div>
          <div className="border-t border-neutral-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">{pageStats.validated} / {pageStats.total} blocs traités</span>
              <button onClick={validatePage} className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white hover:bg-ink/90">
                <Check className="h-3.5 w-3.5" /> Valider la page
              </button>
            </div>
          </div>
        </div>

        {/* Right: blocks panel */}
        <div className="rounded-lg border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-neutral-400" />
              <span className="text-sm font-medium text-neutral-600">Blocs détectés</span>
            </div>
            <span className="text-xs text-neutral-400">{pageBlocks.length} bloc(s)</span>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {pageBlocks.length === 0 && <p className="py-8 text-center text-sm text-neutral-400">Aucun bloc sur cette page.</p>}
            {pageBlocks.map((block) => (
              <div
                key={block.id}
                onClick={() => !mergeMode && setSelectedBlockId(block.id)}
                onMouseEnter={() => setHoveredBlockId(block.id)}
                onMouseLeave={() => setHoveredBlockId(null)}
                className={`border-b border-neutral-100 p-4 transition-colors cursor-pointer ${
                  selectedBlockId === block.id ? 'bg-cyan-50' :
                  mergeSelection.includes(block.id) ? 'bg-ink/5' :
                  hoveredBlockId === block.id ? 'bg-neutral-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {mergeMode && (
                      <input
                        type="checkbox"
                        checked={mergeSelection.includes(block.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          setMergeSelection((prev) => e.target.checked ? [...prev, block.id] : prev.filter((id) => id !== block.id));
                        }}
                        className="h-3.5 w-3.5 accent-ink"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    {statusIcon(block.status)}
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      {blockTypes.find((bt) => bt.value === block.type)?.label ?? block.type}
                    </span>
                  </div>
                  <span className={`text-xs font-medium ${confidenceColor(block.confidence)}`}>
                    {Math.round(block.confidence * 100)}%
                  </span>
                </div>

                {block.source_text && (
                  <p className="mt-2 text-xs text-neutral-400 line-clamp-2">{block.source_text}</p>
                )}

                {selectedBlockId === block.id && !mergeMode && (
                  <div className="mt-3 space-y-3 rounded border border-neutral-200 bg-white p-3">
                    <div>
                      <label className="text-[10px] font-medium uppercase text-neutral-400">Confiance</label>
                      <p className={`text-xs ${confidenceColor(block.confidence)}`}>{Math.round(block.confidence * 100)}% — {confidenceLabel(block.confidence)}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium uppercase text-neutral-400">Source (immuable)</label>
                      <p className="mt-1 rounded bg-neutral-50 p-2 text-xs text-neutral-500">{block.source_text || '—'}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium uppercase text-neutral-400">Version corrigée</label>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onSelect={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          setSplitPoint(target.selectionStart);
                        }}
                        rows={4}
                        className="mt-1 w-full rounded border border-neutral-200 px-2 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium uppercase text-neutral-400">Type</label>
                      <select value={editType} onChange={(e) => handleTypeChange(block.id, e.target.value)} className="mt-1 w-full rounded border border-neutral-200 px-2 py-1.5 text-xs">
                        {[...blockTypes, ...editorialTypes.map((t) => ({ value: t, label: t }))].map((bt) => (
                          <option key={bt.value} value={bt.value}>{bt.label}</option>
                        ))}
                      </select>
                    </div>
                    {block.type === 'image' && (
                      <div>
                        <label className="text-[10px] font-medium uppercase text-neutral-400">Image extraite</label>
                        {block.asset_path ? (
                          <p className="mt-1 text-xs text-neutral-500">{block.asset_path}</p>
                        ) : (
                          <p className="mt-1 text-xs text-amber-600">Aucun asset — utilisez « Recadrer » pour définir la zone</p>
                        )}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button onClick={() => handleValidate(block.id)} className="flex items-center gap-1 rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200">
                        <Check className="h-3 w-3" /> Valider
                      </button>
                      <button onClick={() => handleModify(block.id)} className="flex items-center gap-1 rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-200">
                        <Save className="h-3 w-3" /> Modifier
                      </button>
                      <button onClick={() => handleIgnore(block.id)} className="flex items-center gap-1 rounded bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-500 hover:bg-neutral-200">
                        <X className="h-3 w-3" /> Ignorer
                      </button>
                      <button onClick={handleSplit} disabled={splitPoint === null || splitPoint === 0 || splitPoint >= editText.length} className="flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50">
                        <Split className="h-3 w-3" /> Séparer
                      </button>
                      {block.type === 'image' && (
                        <button onClick={() => openCropModal(block)} className="flex items-center gap-1 rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 hover:bg-purple-200">
                          <Crop className="h-3 w-3" /> Recadrer l'image
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3">
            <button
              onClick={() => {
                const idx = pageBlocks.findIndex((b) => b.id === selectedBlockId);
                if (idx > 0) setSelectedBlockId(pageBlocks[idx - 1].id);
              }}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700"
            >
              <ChevronUp className="h-3.5 w-3.5" /> Bloc précédent
            </button>
            <button
              onClick={() => {
                const idx = pageBlocks.findIndex((b) => b.id === selectedBlockId);
                if (idx >= 0 && idx < pageBlocks.length - 1) setSelectedBlockId(pageBlocks[idx + 1].id);
              }}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700"
            >
              Bloc suivant <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Crop modal */}
      {cropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-neutral-800">Recadrer l'image</h3>
              <button onClick={() => { setCropModal(null); setCropFullImageUrl(null); }} className="rounded p-1 text-neutral-400 hover:bg-neutral-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              Ajustez la zone de l'image sur la page {cropModal.pageNum}. Les coordonnées sont normalisées (0 à 1).
            </p>

            <div className="mt-4 space-y-3">
              <div className="relative mx-auto" style={{ maxWidth: '500px' }}>
                {cropFullImageUrl ? (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cropFullImageUrl} alt="Page" className="max-w-full rounded border border-neutral-200" />
                    {/* Crop overlay */}
                    <div
                      className="absolute border-2 border-cyan-500 bg-cyan-500/20"
                      style={{
                        left: `${cropBox.x * 100}%`,
                        top: `${cropBox.y * 100}%`,
                        width: `${cropBox.width * 100}%`,
                        height: `${cropBox.height * 100}%`,
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex h-[400px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="text-[10px] font-medium uppercase text-neutral-400">Gauche (x)</label>
                  <input type="number" step="0.01" min="0" max="1" value={cropBox.x} onChange={(e) => setCropBox({ ...cropBox, x: Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)) })} className="mt-1 w-full rounded border border-neutral-200 px-2 py-1.5 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-medium uppercase text-neutral-400">Haut (y)</label>
                  <input type="number" step="0.01" min="0" max="1" value={cropBox.y} onChange={(e) => setCropBox({ ...cropBox, y: Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)) })} className="mt-1 w-full rounded border border-neutral-200 px-2 py-1.5 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-medium uppercase text-neutral-400">Largeur</label>
                  <input type="number" step="0.01" min="0.01" max="1" value={cropBox.width} onChange={(e) => setCropBox({ ...cropBox, width: Math.max(0.01, Math.min(1, parseFloat(e.target.value) || 0.01)) })} className="mt-1 w-full rounded border border-neutral-200 px-2 py-1.5 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-medium uppercase text-neutral-400">Hauteur</label>
                  <input type="number" step="0.01" min="0.01" max="1" value={cropBox.height} onChange={(e) => setCropBox({ ...cropBox, height: Math.max(0.01, Math.min(1, parseFloat(e.target.value) || 0.01)) })} className="mt-1 w-full rounded border border-neutral-200 px-2 py-1.5 text-xs" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => { setCropModal(null); setCropFullImageUrl(null); }} className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
                  Annuler
                </button>
                <button onClick={handleRecrop} disabled={cropSaving} className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90 disabled:opacity-50">
                  {cropSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crop className="h-4 w-4" />}
                  Valider le recadrage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
