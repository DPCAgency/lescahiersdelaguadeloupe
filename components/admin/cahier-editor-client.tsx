'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Save, Loader2, ArrowLeft, Plus, Trash2, Eye, EyeOff, Upload, FileText, X } from 'lucide-react';

interface IssuePage {
  id?: string;
  page_number: number;
  position: number;
  title: string;
  preview_image_path: string;
  is_free: boolean;
  individual_price: string;
}

export default function CahierEditorClient({ issueId }: { issueId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(issueId !== 'new');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'infos' | 'pages' | 'monetisation' | 'pdf'>('infos');

  const [issue, setIssue] = useState({
    issue_number: '',
    slug: '',
    title: '',
    subtitle: '',
    description: '',
    publication_date: '',
    cover_image_path: '',
    page_count: 0,
    status: 'draft',
    price_per_page: '0.30',
    full_download_price: '2.90',
    pdf_file_path: '',
    epub_file_path: '',
    subscriptions_allowed: false,
  });

  const [pages, setPages] = useState<IssuePage[]>([]);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfInfo, setPdfInfo] = useState<{ path: string; filename: string; size: number | null } | null>(null);

  const loadIssue = useCallback(async () => {
    if (issueId === 'new') {
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('issues').select('*').eq('id', issueId).maybeSingle();
    if (data) {
      setIssue({
        issue_number: data.issue_number ?? '',
        slug: data.slug ?? '',
        title: data.title ?? '',
        subtitle: data.subtitle ?? '',
        description: data.description ?? '',
        publication_date: data.publication_date ?? '',
        cover_image_path: data.cover_image_path ?? '',
        page_count: data.page_count ?? 0,
        status: data.status ?? 'draft',
        price_per_page: data.price_per_page?.toString() ?? '0.30',
        full_download_price: data.full_download_price?.toString() ?? '2.90',
        pdf_file_path: data.pdf_file_path ?? '',
        epub_file_path: data.epub_file_path ?? '',
        subscriptions_allowed: data.subscriptions_allowed ?? false,
      });
    }
    const { data: pgs } = await supabase
      .from('issue_pages')
      .select('*')
      .eq('issue_id', issueId)
      .order('page_number', { ascending: true });
    setPages(
      (pgs ?? []).map((p) => ({
        id: p.id,
        page_number: p.page_number,
        position: p.position,
        title: p.title ?? '',
        preview_image_path: p.preview_image_path ?? '',
        is_free: p.is_free,
        individual_price: p.individual_price?.toString() ?? '',
      })),
    );
    // Load PDF info
    if (issueId !== 'new') {
      try {
        const resp = await fetch(`/api/admin/issues/${issueId}/pdf`, { credentials: 'same-origin' });
        if (resp.ok) {
          const d = await resp.json() as { has_pdf: boolean; path?: string; filename?: string; size?: number | null };
          if (d.has_pdf) setPdfInfo({ path: d.path!, filename: d.filename!, size: d.size ?? null });
        }
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, [issueId]);

  useEffect(() => {
    loadIssue();
  }, [loadIssue]);

  const updateField = (field: string, value: string | boolean) => {
    setIssue((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const slug = issue.slug || `numero-${issue.issue_number.padStart(2, '0')}`;
      const payload = {
        issue_number: issue.issue_number,
        slug,
        title: issue.title || 'Sans titre',
        subtitle: issue.subtitle || null,
        description: issue.description || null,
        publication_date: issue.publication_date || null,
        cover_image_path: issue.cover_image_path || null,
        page_count: issue.page_count || pages.length,
        status: issue.status,
        price_per_page: parseFloat(issue.price_per_page) || 0.30,
        full_download_price: parseFloat(issue.full_download_price) || 2.90,
        pdf_file_path: issue.pdf_file_path || null,
        epub_file_path: issue.epub_file_path || null,
        subscriptions_allowed: issue.subscriptions_allowed,
      };

      let id = issueId;
      if (issueId === 'new') {
        const { data: newIssue, error } = await supabase.from('issues').insert(payload).select('id').single();
        if (error) throw error;
        id = newIssue.id;
      } else {
        const { error } = await supabase.from('issues').update(payload).eq('id', issueId);
        if (error) throw error;
      }

      // Save pages
      if (pages.length > 0) {
        const existingIds = pages.filter((p) => p.id).map((p) => p.id);
        if (existingIds.length > 0) {
          await supabase.from('issue_pages').delete().eq('issue_id', id).not('id', 'in', `(${existingIds.join(',')})`);
        }
        for (const page of pages) {
          const pageData = {
            issue_id: id,
            page_number: page.page_number,
            position: page.position,
            title: page.title || null,
            preview_image_path: page.preview_image_path || null,
            is_free: page.is_free,
            individual_price: page.individual_price ? parseFloat(page.individual_price) : null,
          };
          if (page.id) {
            await supabase.from('issue_pages').update(pageData).eq('id', page.id);
          } else {
            await supabase.from('issue_pages').insert(pageData);
          }
        }
      }

      if (issueId === 'new') {
        router.push(`/admin/cahiers/${id}`);
      }
    } catch (err) {
      alert(`Erreur: ${err instanceof Error ? err.message : 'Inconnue'}`);
    }
    setSaving(false);
  };

  const addPage = () => {
    const nextNum = pages.length + 1;
    setPages([...pages, {
      page_number: nextNum,
      position: nextNum,
      title: '',
      preview_image_path: '',
      is_free: false,
      individual_price: '',
    }]);
    updateField('page_count', nextNum.toString());
  };

  const updatePage = (index: number, field: keyof IssuePage, value: unknown) => {
    setPages((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const deletePage = (index: number) => {
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePdfUpload = async (file: File) => {
    if (issueId === 'new') { alert('Sauvegardez le Cahier avant d\'ajouter un PDF.'); return; }
    setPdfUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await fetch(`/api/admin/issues/${issueId}/pdf`, {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
      });
      if (!resp.ok) {
        const d = await resp.json() as { error?: string };
        throw new Error(d.error ?? 'Upload échoué');
      }
      const data = await resp.json() as { path: string; original_name: string; size: number };
      setPdfInfo({ path: data.path, filename: data.original_name, size: data.size });
      setIssue((prev) => ({ ...prev, pdf_file_path: data.path }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur');
    }
    setPdfUploading(false);
  };

  const handlePdfDelete = async () => {
    if (!pdfInfo || issueId === 'new') return;
    if (!confirm('Supprimer le PDF associé à ce Cahier ?')) return;
    setPdfUploading(true);
    try {
      const formData = new FormData();
      formData.append('action', 'delete');
      await fetch(`/api/admin/issues/${issueId}/pdf`, {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
      });
      setPdfInfo(null);
      setIssue((prev) => ({ ...prev, pdf_file_path: '' }));
    } catch { /* ignore */ }
    setPdfUploading(false);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  const inputClass = 'w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/cahiers')} className="rounded-lg border border-neutral-200 bg-white p-2 text-neutral-500 hover:bg-neutral-50">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="font-display text-2xl font-bold text-neutral-800">
            {issueId === 'new' ? 'Nouveau Cahier' : `Cahier N°${issue.issue_number}`}
          </h2>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('infos')}
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'infos' ? 'border-b-2 border-ink text-ink' : 'text-neutral-500 hover:text-neutral-700'}`}
        >
          Informations
        </button>
        <button
          onClick={() => setActiveTab('pages')}
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'pages' ? 'border-b-2 border-ink text-ink' : 'text-neutral-500 hover:text-neutral-700'}`}
        >
          Pages ({pages.length})
        </button>
        <button
          onClick={() => setActiveTab('monetisation')}
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'monetisation' ? 'border-b-2 border-ink text-ink' : 'text-neutral-500 hover:text-neutral-700'}`}
        >
          Monétisation
        </button>
        <button
          onClick={() => setActiveTab('pdf')}
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'pdf' ? 'border-b-2 border-ink text-ink' : 'text-neutral-500 hover:text-neutral-700'}`}
        >
          PDF
        </button>
      </div>

      {activeTab === 'infos' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Numéro</label>
              <input type="text" value={issue.issue_number} onChange={(e) => updateField('issue_number', e.target.value)} className={inputClass} placeholder="02" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Slug</label>
              <input type="text" value={issue.slug} onChange={(e) => updateField('slug', e.target.value)} className={inputClass} placeholder="numero-02" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Titre</label>
              <input type="text" value={issue.title} onChange={(e) => updateField('title', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Sous-titre</label>
              <input type="text" value={issue.subtitle} onChange={(e) => updateField('subtitle', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Description</label>
              <textarea value={issue.description} onChange={(e) => updateField('description', e.target.value)} rows={3} className={inputClass} />
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Date de publication</label>
              <input type="date" value={issue.publication_date} onChange={(e) => updateField('publication_date', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Statut</label>
              <select value={issue.status} onChange={(e) => updateField('status', e.target.value)} className={inputClass}>
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
                <option value="archived">Archivé</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Couverture (URL)</label>
              <input type="text" value={issue.cover_image_path} onChange={(e) => updateField('cover_image_path', e.target.value)} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-500">Prix par page (€)</label>
                <input type="text" value={issue.price_per_page} onChange={(e) => updateField('price_per_page', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-500">Prix complet (€)</label>
                <input type="text" value={issue.full_download_price} onChange={(e) => updateField('full_download_price', e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">PDF (chemin)</label>
              <input type="text" value={issue.pdf_file_path} onChange={(e) => updateField('pdf_file_path', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">EPUB (chemin)</label>
              <input type="text" value={issue.epub_file_path} onChange={(e) => updateField('epub_file_path', e.target.value)} className={inputClass} />
            </div>
            <label className="flex items-center gap-2 text-sm text-neutral-600">
              <input type="checkbox" checked={issue.subscriptions_allowed} onChange={(e) => updateField('subscriptions_allowed', e.target.checked)} className="h-4 w-4 accent-ink" />
              Abonnement autorisé (futur)
            </label>
          </div>
        </div>
      )}

      {activeTab === 'monetisation' && (
        <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-neutral-700">Configuration commerciale</h3>
            <p className="mt-1 text-xs text-neutral-400">Définissez les prix et options d'accès pour ce Cahier.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Prix complet (€)</label>
              <input type="text" value={issue.full_download_price} onChange={(e) => updateField('full_download_price', e.target.value)} className={inputClass} />
              <p className="mt-1 text-[11px] text-neutral-400">Prix d'achat du Cahier complet</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Prix par page (€)</label>
              <input type="text" value={issue.price_per_page} onChange={(e) => updateField('price_per_page', e.target.value)} className={inputClass} />
              <p className="mt-1 text-[11px] text-neutral-400">Prix d'achat d'une page individuelle</p>
            </div>
          </div>

          <div className="border-t border-neutral-100 pt-4">
            <h4 className="text-xs font-semibold text-neutral-600">Pages gratuites</h4>
            <p className="mt-1 text-[11px] text-neutral-400">
              Page PDF 1 = Couverture — Page PDF 2 = Première page éditoriale.
              Les pages marquées comme gratuites sont accessibles sans achat.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {pages.map((page, index) => (
                <button
                  key={index}
                  onClick={() => updatePage(index, 'is_free', !page.is_free)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                    page.is_free ? 'border-green-300 bg-green-50 text-green-700' : 'border-neutral-200 bg-white text-neutral-500'
                  }`}
                >
                  {page.is_free ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  Page {String(page.page_number).padStart(2, '0')} — {page.is_free ? 'Gratuite' : 'Payante'}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-neutral-100 pt-4">
            <label className="flex items-center gap-2 text-sm text-neutral-600">
              <input type="checkbox" checked={issue.subscriptions_allowed} onChange={(e) => updateField('subscriptions_allowed', e.target.checked)} className="h-4 w-4 accent-ink" />
              Abonnement autorisé (futur)
            </label>
            <p className="mt-1 text-[11px] text-neutral-400">L'abonnement n'est pas encore activé publiquement.</p>
          </div>

          <div className="border-t border-neutral-100 pt-4">
            <h4 className="text-xs font-semibold text-neutral-600">Prévisualisation</h4>
            <p className="mt-1 text-[11px] text-neutral-400">Vérifiez le paywall sans effectuer de paiement réel.</p>
            <div className="mt-3 flex gap-2">
              <a href={`/les-cahiers/numero-02/lire?preview=visitor`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50">
                <Eye className="h-3.5 w-3.5" />
                Prévisualiser comme visiteur
              </a>
              <a href={`/les-cahiers/numero-02/lire?preview=buyer`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-primary px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary hover:text-white">
                <Eye className="h-3.5 w-3.5" />
                Prévisualiser comme acheteur
              </a>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pages' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500">Gérez les pages du Cahier. Définissez quelles pages sont gratuites.</p>
            <button onClick={addPage} className="flex items-center gap-2 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white hover:bg-ink/90">
              <Plus className="h-3.5 w-3.5" />
              Ajouter une page
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((page, index) => (
              <div key={index} className="rounded-lg border border-neutral-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded bg-neutral-100 font-display text-sm font-bold text-neutral-600">
                    {String(page.page_number).padStart(2, '0')}
                  </span>
                  <button onClick={() => deletePage(index)} className="rounded p-1 text-red-400 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {page.preview_image_path ? (
                  <div className="mt-3 aspect-[3/4] overflow-hidden rounded bg-neutral-100">
                    <img src={page.preview_image_path} alt={page.title} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="mt-3 flex aspect-[3/4] items-center justify-center rounded bg-neutral-50 text-xs text-neutral-300">
                    Pas d'aperçu
                  </div>
                )}
                <input
                  type="text"
                  value={page.title}
                  onChange={(e) => updatePage(index, 'title', e.target.value)}
                  className="mt-3 w-full rounded border border-neutral-200 px-2 py-1.5 text-sm"
                  placeholder="Titre de la page"
                />
                <input
                  type="text"
                  value={page.preview_image_path}
                  onChange={(e) => updatePage(index, 'preview_image_path', e.target.value)}
                  className="mt-2 w-full rounded border border-neutral-200 px-2 py-1.5 text-xs"
                  placeholder="URL de l'aperçu"
                />
                <div className="mt-3 flex items-center justify-between">
                  <button
                    onClick={() => updatePage(index, 'is_free', !page.is_free)}
                    className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium ${
                      page.is_free ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {page.is_free ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {page.is_free ? 'Gratuite' : 'Payante'}
                  </button>
                  <input
                    type="text"
                    value={page.individual_price}
                    onChange={(e) => updatePage(index, 'individual_price', e.target.value)}
                    className="w-20 rounded border border-neutral-200 px-2 py-1 text-xs"
                    placeholder="Prix €"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {activeTab === 'pdf' && (
        <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-neutral-700">PDF du Cahier</h3>
            <p className="mt-1 text-xs text-neutral-400">Associez le PDF original du Cahier pour la lecture en ligne et le téléchargement public.</p>
          </div>

          {pdfInfo ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <FileText className="h-8 w-8 text-neutral-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-700">{pdfInfo.filename}</p>
                  {pdfInfo.size != null && <p className="text-xs text-neutral-400">{formatFileSize(pdfInfo.size)}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
                  {pdfUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Remplacer
                  <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f); }} />
                </label>
                <button onClick={handlePdfDelete} disabled={pdfUploading} className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {issueId === 'new' ? (
                <p className="text-sm text-neutral-400">Sauvegardez le Cahier avant d'ajouter un PDF.</p>
              ) : (
                <>
                  <p className="text-sm text-neutral-400">Aucun PDF associé.</p>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-200 px-4 py-8 text-sm text-neutral-500 hover:bg-neutral-50">
                    {pdfUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                    Téléverser un PDF
                    <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f); }} />
                  </label>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
