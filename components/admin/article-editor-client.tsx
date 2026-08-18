'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save, Loader2, Plus, Trash2, ChevronUp, ChevronDown, Eye,
  ArrowLeft, GripVertical, GitCompare, Upload, AlertCircle,
} from 'lucide-react';
import { RichTextEditor } from './rich-text-editor';
import { RichTextRenderer } from '@/components/editorial/rich-text-renderer';

interface ArticleBlock {
  id?: string;
  type: string;
  position: number;
  content_json: Record<string, unknown> | null;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const blockTypes = [
  { value: 'paragraph', label: 'Texte' },
  { value: 'heading', label: 'Titre' },
  { value: 'image', label: 'Image' },
  { value: 'gallery', label: 'Galerie' },
  { value: 'quote', label: 'Citation' },
  { value: 'key_figures', label: 'Chiffres clés' },
  { value: 'timeline', label: 'Chronologie' },
  { value: 'fact', label: 'Fait établi' },
  { value: 'document', label: 'Document' },
  { value: 'testimony', label: 'Témoignage' },
  { value: 'analysis', label: 'Analyse' },
  { value: 'open_question', label: 'Question ouverte' },
  { value: 'hypothesis', label: 'Hypothèse' },
  { value: 'sidebar', label: 'Encadré' },
  { value: 'video', label: 'Vidéo' },
  { value: 'source', label: 'Source' },
  { value: 'issue_reference', label: 'Référence Cahier' },
];

const blockColors: Record<string, string> = {
  fact: 'border-l-green-500',
  testimony: 'border-l-amber-500',
  hypothesis: 'border-l-purple-500',
  open_question: 'border-l-blue-500',
  analysis: 'border-l-cyan-500',
  document: 'border-l-neutral-500',
};

const statusOptions = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'review', label: 'En revue' },
  { value: 'ready', label: 'Prêt' },
  { value: 'scheduled', label: 'Programmé' },
  { value: 'published', label: 'Publié' },
  { value: 'archived', label: 'Archivé' },
];

const formatOptions = [
  { value: 'enquete', label: 'Enquête' },
  { value: 'analyse', label: 'Analyse' },
  { value: 'decryptage', label: 'Décryptage' },
  { value: 'entretien', label: 'Entretien' },
  { value: 'chronologie', label: 'Chronologie' },
  { value: 'tribune', label: 'Tribune' },
  { value: 'reportage', label: 'Reportage' },
  { value: 'dossier', label: 'Dossier' },
];

function countWords(json: unknown): number {
  if (!json || typeof json !== 'object') return 0;
  const node = json as { type?: string; text?: string; content?: unknown[] };
  if (node.type === 'text' && node.text) {
    return node.text.trim().split(/\s+/).filter(Boolean).length;
  }
  if (node.content) {
    return node.content.reduce<number>((sum, c) => sum + countWords(c), 0);
  }
  return 0;
}

export default function ArticleEditorClient({
  articleId,
  categories,
  authors,
  territories,
}: {
  articleId: string;
  categories: { id: string; name: string }[];
  authors: { id: string; name: string }[];
  territories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(articleId !== 'new');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  const [sourceBlocks, setSourceBlocks] = useState<{ id: string; page_number: number; type: string; source_text: string | null; edited_text: string | null }[]>([]);
  const [sourceInfo, setSourceInfo] = useState<{ issue_number: string; title: string; page_start: number; page_end: number } | null>(null);
  const [currentId, setCurrentId] = useState(articleId);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [article, setArticle] = useState({
    title: '',
    slug: '',
    subtitle: '',
    excerpt: '',
    format: 'analyse',
    category_id: '',
    author_id: '',
    hero_image_path: '',
    hero_caption: '',
    hero_credit: '',
    status: 'draft',
    featured: false,
    published_at: '',
    seo_title: '',
    seo_description: '',
    social_image_path: '',
    reading_time_minutes: '',
  });
  const [blocks, setBlocks] = useState<ArticleBlock[]>([]);
  const [selectedTerritories, setSelectedTerritories] = useState<Set<string>>(new Set());

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirty = useRef(false);
  const currentIdRef = useRef(articleId);

  const loadArticle = useCallback(async () => {
    if (articleId === 'new') {
      setLoading(false);
      return;
    }
    const resp = await fetch(`/api/admin/articles/${articleId}`, { credentials: 'same-origin' });
    if (resp.ok) {
      const d = await resp.json() as Record<string, unknown>;
      setArticle({
        title: (d.title as string) ?? '',
        slug: (d.slug as string) ?? '',
        subtitle: (d.subtitle as string) ?? '',
        excerpt: (d.excerpt as string) ?? '',
        format: (d.format as string) ?? 'analyse',
        category_id: (d.category_id as string) ?? '',
        author_id: (d.author_id as string) ?? '',
        hero_image_path: (d.hero_image_path as string) ?? '',
        hero_caption: (d.hero_caption as string) ?? '',
        hero_credit: (d.hero_credit as string) ?? '',
        status: (d.status as string) ?? 'draft',
        featured: (d.featured as boolean) ?? false,
        published_at: d.published_at ? new Date(d.published_at as string).toISOString().slice(0, 16) : '',
        seo_title: (d.seo_title as string) ?? '',
        seo_description: (d.seo_description as string) ?? '',
        social_image_path: (d.social_image_path as string) ?? '',
        reading_time_minutes: (d.reading_time_minutes as number)?.toString() ?? '',
      });
      const blks = (d.blocks as Array<Record<string, unknown>>) ?? [];
      setBlocks(blks.map((b) => ({
        id: b.id as string,
        type: b.type as string,
        position: b.position as number,
        content_json: (b.content_json ?? {}) as Record<string, unknown>,
      })));
      const terrIds = (d.territory_ids as string[]) ?? [];
      setSelectedTerritories(new Set(terrIds));
    }
    setLoading(false);
  }, [articleId]);

  useEffect(() => { loadArticle(); }, [loadArticle]);

  // Unsaved changes warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const markDirty = useCallback(() => {
    isDirty.current = true;
    setSaveState('idle');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { doSave(false); }, 1500);
  }, []);

  const updateField = (field: string, value: string | boolean) => {
    setArticle((prev) => ({ ...prev, [field]: value }));
    markDirty();
  };

  const addBlock = (type: string) => {
    const newBlock: ArticleBlock = { type, position: blocks.length, content_json: {} };
    setBlocks([...blocks, newBlock]);
    setShowBlockMenu(false);
    markDirty();
  };

  const updateBlockContent = (index: number, key: string, value: unknown) => {
    setBlocks((prev) =>
      prev.map((b, i) => {
        if (i !== index) return b;
        return { ...b, content_json: { ...(b.content_json ?? {}), [key]: value } };
      }),
    );
    markDirty();
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[swapIndex]] = [newBlocks[swapIndex], newBlocks[index]];
    newBlocks.forEach((b, i) => (b.position = i));
    setBlocks(newBlocks);
    markDirty();
  };

  const deleteBlock = (index: number) => {
    const newBlocks = blocks.filter((_, i) => i !== index);
    newBlocks.forEach((b, i) => (b.position = i));
    setBlocks(newBlocks);
    markDirty();
  };

  const toggleTerritory = (id: string) => {
    setSelectedTerritories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    markDirty();
  };

  const doSave = useCallback(async (manual: boolean) => {
    const id = currentIdRef.current;
    if (id === 'new') {
      // Create first
      setSaveState('saving');
      try {
        const slug = article.slug || article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const createResp = await fetch('/api/admin/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            title: article.title || 'Sans titre',
            subtitle: article.subtitle || null,
            excerpt: article.excerpt || null,
            format: article.format,
            category_id: article.category_id || null,
            author_id: article.author_id || null,
            hero_image_path: article.hero_image_path || null,
            hero_caption: article.hero_caption || null,
            hero_credit: article.hero_credit || null,
            status: article.status,
            featured: article.featured,
          }),
        });
        if (!createResp.ok) throw new Error('Création échouée');
        const created = await createResp.json() as { id: string };
        currentIdRef.current = created.id;
        setCurrentId(created.id);
        // Now save blocks + territories via PATCH
        const patchResp = await fetch(`/api/admin/articles/${created.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            blocks: blocks.map((b, i) => ({ type: b.type, position: i, content_json: b.content_json })),
            territory_ids: Array.from(selectedTerritories),
            seo_title: article.seo_title || null,
            seo_description: article.seo_description || null,
            social_image_path: article.social_image_path || null,
            reading_time_minutes: totalWords > 0 ? Math.max(1, Math.ceil(totalWords / 200)) : null,
          }),
        });
        if (!patchResp.ok) throw new Error('Sauvegarde blocs échouée');
        isDirty.current = false;
        setSaveState('saved');
        router.push(`/admin/articles/${created.id}`);
      } catch {
        setSaveState('error');
      }
      return;
    }

    setSaveState('saving');
    try {
      const slug = article.slug || article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const resp = await fetch(`/api/admin/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          title: article.title || 'Sans titre',
          slug,
          subtitle: article.subtitle || null,
          excerpt: article.excerpt || null,
          format: article.format,
          category_id: article.category_id || null,
          author_id: article.author_id || null,
          hero_image_path: article.hero_image_path || null,
          hero_caption: article.hero_caption || null,
          hero_credit: article.hero_credit || null,
          status: article.status,
          featured: article.featured,
          published_at: article.published_at || null,
          seo_title: article.seo_title || null,
          seo_description: article.seo_description || null,
          social_image_path: article.social_image_path || null,
          reading_time_minutes: totalWords > 0 ? Math.max(1, Math.ceil(totalWords / 200)) : null,
          blocks: blocks.map((b, i) => ({ type: b.type, position: i, content_json: b.content_json })),
          territory_ids: Array.from(selectedTerritories),
        }),
      });
      if (!resp.ok) throw new Error('Sauvegarde échouée');
      isDirty.current = false;
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }, [article, blocks, selectedTerritories, router]);

  const handleSave = () => { doSave(true); };

  const handleHeroUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await fetch('/api/admin/media/upload', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
      });
      if (!resp.ok) {
        const d = await resp.json() as { error?: string };
        throw new Error(d.error ?? 'Upload échoué');
      }
      const data = await resp.json() as { url: string };
      updateField('hero_image_path', data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erreur');
    }
    setUploading(false);
  };

  // Word count
  const totalWords = blocks.reduce((sum, b) => {
    const c = b.content_json ?? {};
    if (c.richContent) return sum + countWords(c.richContent);
    if (c.text) return sum + (c.text as string).trim().split(/\s+/).filter(Boolean).length;
    return sum;
  }, 0);
  const readingTime = totalWords > 0 ? Math.max(1, Math.ceil(totalWords / 200)) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/articles')}
            className="rounded-lg border border-neutral-200 bg-white p-2 text-neutral-500 hover:bg-neutral-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="font-display text-2xl font-bold text-neutral-800">
            {currentId === 'new' ? 'Nouvel article' : 'Modifier l\'article'}
          </h2>
          <SaveIndicator state={saveState} onRetry={handleSave} />
          {totalWords > 0 && (
            <span className="text-xs text-neutral-400">{totalWords} mots · {readingTime} min</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {sourceBlocks.length > 0 && (
            <button
              onClick={() => { setCompareMode(!compareMode); setPreviewMode(false); }}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${compareMode ? 'border-ink bg-ink text-white' : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'}`}
            >
              <GitCompare className="h-4 w-4" />
              {compareMode ? 'Quitter comparaison' : 'Comparer à la source'}
            </button>
          )}
          <button
            onClick={() => { setPreviewMode(!previewMode); setCompareMode(false); }}
            className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
          >
            <Eye className="h-4 w-4" />
            {previewMode ? 'Éditer' : 'Prévisualiser'}
          </button>
          <button
            onClick={handleSave}
            disabled={saveState === 'saving'}
            className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90 disabled:opacity-50"
          >
            {saveState === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </button>
        </div>
      </div>

      {compareMode ? (
        <div className="space-y-4">
          {sourceInfo && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-medium text-neutral-700">
                Source : <strong>Cahier N°{sourceInfo.issue_number}</strong> — {sourceInfo.title}
              </p>
              <p className="mt-1 text-xs text-neutral-500">Pages {sourceInfo.page_start}–{sourceInfo.page_end}</p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-neutral-600">Blocs source (Cahier)</h3>
              <div className="space-y-3">
                {sourceBlocks.map((src, i) => (
                  <div key={i} className="rounded border border-neutral-100 bg-neutral-50 p-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{src.type} · P{src.page_number}</span>
                    <p className="mt-1 text-xs text-neutral-500">{src.source_text ?? '—'}</p>
                  </div>
                ))}
                {sourceBlocks.length === 0 && <p className="text-xs text-neutral-400">Aucun bloc source.</p>}
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-neutral-600">Blocs article</h3>
              <div className="space-y-3">
                {blocks.map((block, i) => (
                  <div key={i} className="rounded border border-neutral-100 bg-white p-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{block.type}</span>
                    <p className="mt-1 text-xs text-neutral-600">{String(block.content_json?.text ?? '')}</p>
                  </div>
                ))}
                {blocks.length === 0 && <p className="text-xs text-neutral-400">Aucun bloc.</p>}
              </div>
            </div>
          </div>
        </div>
      ) : previewMode ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8">
          <article className="mx-auto max-w-2xl">
            <h1 className="font-display text-3xl font-bold text-neutral-800">{article.title || 'Titre non défini'}</h1>
            {article.subtitle && <p className="mt-2 text-lg text-neutral-500">{article.subtitle}</p>}
            {article.excerpt && <p className="mt-4 text-base italic text-neutral-600">{article.excerpt}</p>}
            {article.hero_image_path && (
              <figure className="mt-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={article.hero_image_path} alt={article.hero_caption ?? ''} className="w-full rounded-lg" />
                {article.hero_caption && <figcaption className="mt-2 text-xs text-neutral-400">{article.hero_caption}{article.hero_credit ? ` — © ${article.hero_credit}` : ''}</figcaption>}
              </figure>
            )}
            <div className="mt-8 space-y-4">
              {blocks.map((block, i) => (
                <BlockPreview key={i} block={block} />
              ))}
            </div>
          </article>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-neutral-600">Informations principales</h3>
              <div className="space-y-4">
                <Field label="Titre">
                  <input type="text" value={article.title} onChange={(e) => updateField('title', e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" placeholder="Titre de l'article" />
                </Field>
                <Field label="Slug (URL)">
                  <input type="text" value={article.slug} onChange={(e) => updateField('slug', e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" placeholder="auto-généré si vide" />
                </Field>
                <Field label="Sous-titre">
                  <input type="text" value={article.subtitle} onChange={(e) => updateField('subtitle', e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
                </Field>
                <Field label="Chapô (extrait)">
                  <textarea value={article.excerpt} onChange={(e) => updateField('excerpt', e.target.value)} rows={2} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
                </Field>
              </div>
            </div>

            {/* Modular blocks editor */}
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-neutral-600">Contenu de l'article</h3>
                <button onClick={() => setShowBlockMenu(!showBlockMenu)} className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white hover:bg-ink/90">
                  <Plus className="h-3.5 w-3.5" /> Ajouter un bloc
                </button>
              </div>

              {showBlockMenu && (
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 sm:grid-cols-3">
                  {blockTypes.map((bt) => (
                    <button key={bt.value} onClick={() => addBlock(bt.value)} className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-600 hover:border-ink hover:text-ink">
                      {bt.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-4 space-y-3">
                {blocks.length === 0 && (
                  <p className="py-8 text-center text-sm text-neutral-400">Aucun bloc. Cliquez sur « Ajouter un bloc » pour commencer.</p>
                )}
                {blocks.map((block, index) => (
                  <div key={index} className={`rounded-lg border border-neutral-200 border-l-4 bg-white p-4 ${blockColors[block.type] ?? 'border-l-neutral-300'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-neutral-300" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{blockTypes.find((bt) => bt.value === block.type)?.label ?? block.type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveBlock(index, 'up')} disabled={index === 0} className="rounded p-1 text-neutral-400 hover:bg-neutral-100 disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
                        <button onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1} className="rounded p-1 text-neutral-400 hover:bg-neutral-100 disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
                        <button onClick={() => deleteBlock(index)} className="rounded p-1 text-red-400 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    <BlockEditor block={block} index={index} onUpdate={updateBlockContent} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-neutral-600">Publication</h3>
              <div className="space-y-4">
                <Field label="Statut">
                  <select value={article.status} onChange={(e) => updateField('status', e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm">
                    {statusOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </Field>
                <Field label="Format">
                  <select value={article.format} onChange={(e) => updateField('format', e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm">
                    {formatOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </Field>
                <Field label="Catégorie">
                  <select value={article.category_id} onChange={(e) => updateField('category_id', e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm">
                    <option value="">—</option>
                    {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </Field>
                <Field label="Auteur">
                  <select value={article.author_id} onChange={(e) => updateField('author_id', e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm">
                    <option value="">—</option>
                    {authors.map((auth) => <option key={auth.id} value={auth.id}>{auth.name}</option>)}
                  </select>
                </Field>
                <label className="flex items-center gap-2 text-sm text-neutral-600">
                  <input type="checkbox" checked={article.featured} onChange={(e) => updateField('featured', e.target.checked)} className="h-4 w-4 accent-ink" />
                  Article à la Une
                </label>
                <Field label="Date de publication">
                  <input type="datetime-local" value={article.published_at} onChange={(e) => updateField('published_at', e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
                </Field>
              </div>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-neutral-600">Territoires</h3>
              <div className="space-y-2">
                {territories.map((terr) => (
                  <label key={terr.id} className="flex items-center gap-2 text-sm text-neutral-600">
                    <input type="checkbox" checked={selectedTerritories.has(terr.id)} onChange={() => toggleTerritory(terr.id)} className="h-4 w-4 accent-ink" />
                    {terr.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-neutral-600">Image principale</h3>
              <div className="space-y-4">
                {article.hero_image_path && (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={article.hero_image_path} alt="Aperçu" className="w-full rounded-lg" />
                  </div>
                )}
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-200 px-3 py-4 text-sm text-neutral-500 hover:bg-neutral-50">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? 'Upload...' : 'Téléverser une image'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHeroUpload(f); }} />
                </label>
                {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
                <Field label="Ou URL de l'image">
                  <input type="text" value={article.hero_image_path} onChange={(e) => updateField('hero_image_path', e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" placeholder="/assets/..." />
                </Field>
                <Field label="Légende">
                  <input type="text" value={article.hero_caption} onChange={(e) => updateField('hero_caption', e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
                </Field>
                <Field label="Crédit">
                  <input type="text" value={article.hero_credit} onChange={(e) => updateField('hero_credit', e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
                </Field>
              </div>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <button onClick={() => setShowSeo(!showSeo)} className="flex w-full items-center justify-between font-display text-sm font-semibold uppercase tracking-wider text-neutral-600">
                SEO
                <ChevronDown className={`h-4 w-4 transition-transform ${showSeo ? 'rotate-180' : ''}`} />
              </button>
              {showSeo && (
                <div className="mt-4 space-y-4">
                  <Field label="Titre SEO">
                    <input type="text" value={article.seo_title} onChange={(e) => updateField('seo_title', e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
                  </Field>
                  <Field label="Description SEO">
                    <textarea value={article.seo_description} onChange={(e) => updateField('seo_description', e.target.value)} rows={2} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
                  </Field>
                  <Field label="Image sociale (URL)">
                    <input type="text" value={article.social_image_path} onChange={(e) => updateField('social_image_path', e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
                  </Field>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SaveIndicator({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  if (state === 'saving') return <span className="text-xs text-neutral-400">Enregistrement...</span>;
  if (state === 'saved') return <span className="text-xs text-green-500">✓ Enregistré</span>;
  if (state === 'error') return (
    <button onClick={onRetry} className="flex items-center gap-1 text-xs text-red-500 hover:underline">
      <AlertCircle className="h-3 w-3" /> Erreur — Réessayer
    </button>
  );
  return <span className="text-xs text-amber-500">● Modifications</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-neutral-500">{label}</label>
      {children}
    </div>
  );
}

function BlockEditor({
  block, index, onUpdate,
}: {
  block: ArticleBlock;
  index: number;
  onUpdate: (index: number, key: string, value: unknown) => void;
}) {
  const content = block.content_json ?? {};
  const type = block.type;
  const inputClass = 'mt-2 w-full rounded border border-neutral-200 px-2.5 py-1.5 text-sm';

  if (type === 'paragraph') {
    return (
      <div className="mt-2">
        <RichTextEditor
          content={content.richContent ?? content.text ?? ''}
          onChange={(json) => onUpdate(index, 'richContent', json)}
          editable
        />
      </div>
    );
  }

  if (type === 'analysis' || type === 'fact' || type === 'testimony' || type === 'hypothesis' || type === 'open_question' || type === 'sidebar' || type === 'source') {
    return (
      <div>
        <textarea value={(content.text as string) ?? ''} onChange={(e) => onUpdate(index, 'text', e.target.value)} rows={4} className={inputClass} placeholder="Texte du bloc…" />
        {(type === 'fact' || type === 'source') && (
          <input type="text" value={(content.source as string) ?? ''} onChange={(e) => onUpdate(index, 'source', e.target.value)} className={inputClass} placeholder="Source…" />
        )}
        {type === 'testimony' && (
          <>
            <input type="text" value={(content.identity as string) ?? ''} onChange={(e) => onUpdate(index, 'identity', e.target.value)} className={inputClass} placeholder="Identité affichée…" />
            <input type="text" value={(content.context as string) ?? ''} onChange={(e) => onUpdate(index, 'context', e.target.value)} className={inputClass} placeholder="Contexte…" />
          </>
        )}
        {type === 'open_question' && (
          <input type="text" value={(content.context as string) ?? ''} onChange={(e) => onUpdate(index, 'context', e.target.value)} className={inputClass} placeholder="Contexte de la question…" />
        )}
      </div>
    );
  }

  if (type === 'heading') {
    return (
      <div className="flex gap-2">
        <input type="number" value={(content.level as number) ?? 2} onChange={(e) => onUpdate(index, 'level', parseInt(e.target.value) || 2)} className="w-16 rounded border border-neutral-200 px-2 py-1.5 text-sm" min={1} max={6} />
        <input type="text" value={(content.heading as string) ?? ''} onChange={(e) => onUpdate(index, 'heading', e.target.value)} className="flex-1 rounded border border-neutral-200 px-2.5 py-1.5 text-sm" placeholder="Titre…" />
      </div>
    );
  }

  if (type === 'image') {
    return (
      <div>
        <input type="text" value={(content.image_path as string) ?? ''} onChange={(e) => onUpdate(index, 'image_path', e.target.value)} className={inputClass} placeholder="URL de l'image…" />
        <input type="text" value={(content.alt as string) ?? ''} onChange={(e) => onUpdate(index, 'alt', e.target.value)} className={inputClass} placeholder="Texte alternatif…" />
        <input type="text" value={(content.caption as string) ?? ''} onChange={(e) => onUpdate(index, 'caption', e.target.value)} className={inputClass} placeholder="Légende…" />
        <input type="text" value={(content.credit as string) ?? ''} onChange={(e) => onUpdate(index, 'credit', e.target.value)} className={inputClass} placeholder="Crédit…" />
      </div>
    );
  }

  if (type === 'quote') {
    return (
      <div>
        <textarea value={(content.quote as string) ?? ''} onChange={(e) => onUpdate(index, 'quote', e.target.value)} rows={3} className={inputClass} placeholder="Citation…" />
        <input type="text" value={(content.author as string) ?? ''} onChange={(e) => onUpdate(index, 'author', e.target.value)} className={inputClass} placeholder="Auteur de la citation…" />
        <input type="text" value={(content.role as string) ?? ''} onChange={(e) => onUpdate(index, 'role', e.target.value)} className={inputClass} placeholder="Fonction…" />
      </div>
    );
  }

  if (type === 'key_figures') {
    const figures = (content.figures as { value: string; label: string; source?: string }[]) ?? [];
    return (
      <div>
        {figures.map((fig, fi) => (
          <div key={fi} className="mt-2 flex gap-2">
            <input type="text" value={fig.value} onChange={(e) => { const next = [...figures]; next[fi] = { ...fig, value: e.target.value }; onUpdate(index, 'figures', next); }} className="w-24 rounded border border-neutral-200 px-2 py-1.5 text-sm" placeholder="Valeur" />
            <input type="text" value={fig.label} onChange={(e) => { const next = [...figures]; next[fi] = { ...fig, label: e.target.value }; onUpdate(index, 'figures', next); }} className="flex-1 rounded border border-neutral-200 px-2 py-1.5 text-sm" placeholder="Description" />
            <button onClick={() => onUpdate(index, 'figures', figures.filter((_, x) => x !== fi))} className="rounded p-1.5 text-red-400 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        <button onClick={() => onUpdate(index, 'figures', [...figures, { value: '', label: '' }])} className="mt-2 flex items-center gap-1 text-xs font-medium text-ink hover:underline"><Plus className="h-3 w-3" /> Ajouter un chiffre</button>
      </div>
    );
  }

  if (type === 'timeline') {
    const events = (content.events as { date: string; title: string; description: string }[]) ?? [];
    return (
      <div>
        {events.map((ev, ei) => (
          <div key={ei} className="mt-2 space-y-1 rounded border border-neutral-100 p-2">
            <div className="flex gap-2">
              <input type="text" value={ev.date} onChange={(e) => { const next = [...events]; next[ei] = { ...ev, date: e.target.value }; onUpdate(index, 'events', next); }} className="w-28 rounded border border-neutral-200 px-2 py-1.5 text-sm" placeholder="Date" />
              <input type="text" value={ev.title} onChange={(e) => { const next = [...events]; next[ei] = { ...ev, title: e.target.value }; onUpdate(index, 'events', next); }} className="flex-1 rounded border border-neutral-200 px-2 py-1.5 text-sm" placeholder="Titre" />
              <button onClick={() => onUpdate(index, 'events', events.filter((_, x) => x !== ei))} className="rounded p-1.5 text-red-400 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            <input type="text" value={ev.description} onChange={(e) => { const next = [...events]; next[ei] = { ...ev, description: e.target.value }; onUpdate(index, 'events', next); }} className="w-full rounded border border-neutral-200 px-2 py-1.5 text-sm" placeholder="Description" />
          </div>
        ))}
        <button onClick={() => onUpdate(index, 'events', [...events, { date: '', title: '', description: '' }])} className="mt-2 flex items-center gap-1 text-xs font-medium text-ink hover:underline"><Plus className="h-3 w-3" /> Ajouter un événement</button>
      </div>
    );
  }

  if (type === 'issue_reference') {
    return (
      <div>
        <input type="text" value={(content.issue_number as string) ?? ''} onChange={(e) => onUpdate(index, 'issue_number', e.target.value)} className={inputClass} placeholder="N° du Cahier…" />
        <input type="text" value={(content.pages as string) ?? ''} onChange={(e) => onUpdate(index, 'pages', e.target.value)} className={inputClass} placeholder="Pages (ex: 4–5)…" />
      </div>
    );
  }

  if (type === 'video') {
    return <input type="text" value={(content.url as string) ?? ''} onChange={(e) => onUpdate(index, 'url', e.target.value)} className={inputClass} placeholder="URL de la vidéo…" />;
  }

  if (type === 'gallery') {
    const images = (content.images as string[]) ?? [];
    return <textarea value={images.join('\n')} onChange={(e) => onUpdate(index, 'images', e.target.value.split('\n').filter(Boolean))} rows={3} className={inputClass} placeholder="Une URL d'image par ligne…" />;
  }

  if (type === 'document') {
    return (
      <div>
        <input type="text" value={(content.title as string) ?? ''} onChange={(e) => onUpdate(index, 'title', e.target.value)} className={inputClass} placeholder="Titre du document…" />
        <input type="text" value={(content.file_path as string) ?? ''} onChange={(e) => onUpdate(index, 'file_path', e.target.value)} className={inputClass} placeholder="URL du document…" />
      </div>
    );
  }

  return <p className="mt-2 text-xs text-neutral-400">Type de bloc non reconnu.</p>;
}

function BlockPreview({ block }: { block: ArticleBlock }) {
  const content = block.content_json ?? {};
  const type = block.type;

  if (type === 'paragraph') {
    return <RichTextRenderer content={content.richContent ?? content.text} className="text-neutral-700" />;
  }
  if (type === 'analysis' || type === 'fact' || type === 'testimony' || type === 'hypothesis' || type === 'open_question' || type === 'sidebar' || type === 'source') {
    return <p className="text-neutral-700">{(content.text as string) || ''}</p>;
  }
  if (type === 'heading') {
    const Tag = (`h${content.level ?? 2}`) as keyof React.JSX.IntrinsicElements;
    return <Tag className="font-display font-bold text-neutral-800">{(content.heading as string) || ''}</Tag>;
  }
  if (type === 'quote') {
    return (
      <blockquote className="border-l-4 border-ink pl-4 text-lg italic text-neutral-700">
        « {(content.quote as string) || ''} »
        {content.author ? <footer className="mt-2 text-sm not-italic text-neutral-500">— {content.author as string}</footer> : null}
      </blockquote>
    );
  }
  if (type === 'image') {
    return (
      <figure>
        {content.image_path ? <img src={content.image_path as string} alt={(content.alt as string) ?? ''} className="rounded-lg" /> : null}
        {content.caption ? <figcaption className="mt-1 text-xs text-neutral-400">{content.caption as string}</figcaption> : null}
      </figure>
    );
  }
  if (type === 'key_figures') {
    const figures = (content.figures as { value: string; label: string }[]) ?? [];
    return (
      <div className="grid grid-cols-2 gap-4">
        {figures.map((f, i) => (
          <div key={i} className="rounded border border-neutral-200 p-4 text-center">
            <p className="font-display text-2xl font-bold text-ink">{f.value}</p>
            <p className="text-xs text-neutral-500">{f.label}</p>
          </div>
        ))}
      </div>
    );
  }
  if (type === 'timeline') {
    const events = (content.events as { date: string; title: string; description: string }[]) ?? [];
    return (
      <ol className="space-y-3">
        {events.map((ev, i) => (
          <li key={i} className="flex gap-3">
            <span className="font-display font-bold text-ink">{ev.date}</span>
            <div>
              <p className="font-medium text-neutral-700">{ev.title}</p>
              <p className="text-sm text-neutral-500">{ev.description}</p>
            </div>
          </li>
        ))}
      </ol>
    );
  }
  return <p className="text-xs text-neutral-400">[{type}]</p>;
}
