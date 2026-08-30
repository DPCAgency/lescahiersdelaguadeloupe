'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';

interface SitePage {
  id?: string;
  slug: string;
  title: string;
  content_json: string;
  status: string;
  seo_title: string;
  seo_description: string;
}

export default function AdminPagesPage() {
  const [pages, setPages] = useState<SitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('site_pages').select('*').order('slug');
    setPages((data ?? []).map((p) => ({ ...p, content_json: JSON.stringify(p.content_json ?? {}, null, 2) })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = (index: number, field: keyof SitePage, value: string) => {
    setPages((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const save = async (page: SitePage) => {
    setSaving(true);
    let parsed = {};
    try { parsed = JSON.parse(page.content_json); } catch { /* empty object on parse error */ }
    const payload = {
      slug: page.slug,
      title: page.title,
      content_json: parsed,
      status: page.status,
      seo_title: page.seo_title || null,
      seo_description: page.seo_description || null,
    };
    if (page.id) {
      await supabase.from('site_pages').update(payload).eq('id', page.id);
    } else {
      const { data } = await supabase.from('site_pages').insert(payload).select('id').single();
      if (data) page.id = data.id;
    }
    setSaving(false);
  };

  const addNew = () => {
    setPages([...pages, { slug: '', title: '', content_json: '{}', status: 'draft', seo_title: '', seo_description: '' }]);
  };

  const remove = async (page: SitePage) => {
    if (!page.id) return;
    if (!confirm(`Supprimer "${page.title}" ?`)) return;
    await supabase.from('site_pages').delete().eq('id', page.id);
    await load();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-neutral-800">Pages institutionnelles</h2>
          <p className="mt-1 text-sm text-neutral-500">Gérez les pages statiques du site.</p>
        </div>
        <button onClick={addNew} className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90">
          <Plus className="h-4 w-4" /> Nouvelle page
        </button>
      </div>

      <div className="space-y-4">
        {pages.map((page, index) => (
          <div key={page.id ?? index} className="rounded-lg border border-neutral-200 bg-white p-5">
            <div className="flex flex-wrap items-center gap-3">
              <input type="text" value={page.slug} onChange={(e) => update(index, 'slug', e.target.value)} className="w-40 rounded border border-neutral-200 px-3 py-2 text-sm" placeholder="slug" />
              <input type="text" value={page.title} onChange={(e) => update(index, 'title', e.target.value)} className="flex-1 rounded border border-neutral-200 px-3 py-2 text-sm" placeholder="Titre" />
              <select value={page.status} onChange={(e) => update(index, 'status', e.target.value)} className="rounded border border-neutral-200 px-3 py-2 text-sm">
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
              </select>
              <button onClick={() => save(page)} disabled={saving} className="rounded-lg bg-ink px-3 py-2 text-xs font-medium text-white hover:bg-ink/90 disabled:opacity-50">
                <Save className="h-3.5 w-3.5" />
              </button>
              {page.id && (
                <button onClick={() => remove(page)} className="rounded p-2 text-red-400 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <input type="text" value={page.seo_title} onChange={(e) => update(index, 'seo_title', e.target.value)} className="rounded border border-neutral-200 px-3 py-2 text-sm" placeholder="Titre SEO" />
              <input type="text" value={page.seo_description} onChange={(e) => update(index, 'seo_description', e.target.value)} className="rounded border border-neutral-200 px-3 py-2 text-sm" placeholder="Description SEO" />
            </div>
            <textarea value={page.content_json} onChange={(e) => update(index, 'content_json', e.target.value)} rows={6} className="mt-3 w-full rounded border border-neutral-200 px-3 py-2 font-mono text-xs" spellCheck={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
