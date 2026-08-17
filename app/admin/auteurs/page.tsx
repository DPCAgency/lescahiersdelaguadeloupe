'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';

interface Author {
  id?: string;
  name: string;
  slug: string;
  bio: string;
  job_title: string;
  photo_path: string;
  email_public: string;
  is_active: boolean;
}

export default function AdminAuteursPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('authors').select('*').order('name');
    setAuthors(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = (index: number, field: keyof Author, value: unknown) => {
    setAuthors((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  };

  const save = async (auth: Author) => {
    setSaving(true);
    const payload = {
      name: auth.name,
      slug: auth.slug,
      bio: auth.bio || null,
      job_title: auth.job_title || null,
      photo_path: auth.photo_path || null,
      email_public: auth.email_public || null,
      is_active: auth.is_active,
    };
    if (auth.id) {
      await supabase.from('authors').update(payload).eq('id', auth.id);
    } else {
      const { data } = await supabase.from('authors').insert(payload).select('id').single();
      if (data) auth.id = data.id;
    }
    setSaving(false);
  };

  const addNew = () => {
    setAuthors([...authors, { name: '', slug: '', bio: '', job_title: '', photo_path: '', email_public: '', is_active: true }]);
  };

  const remove = async (auth: Author) => {
    if (!auth.id) return;
    if (!confirm(`Supprimer "${auth.name}" ?`)) return;
    await supabase.from('authors').delete().eq('id', auth.id);
    await load();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-neutral-800">Auteurs</h2>
          <p className="mt-1 text-sm text-neutral-500">Gérez les auteurs et contributeurs.</p>
        </div>
        <button onClick={addNew} className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90">
          <Plus className="h-4 w-4" /> Nouvel auteur
        </button>
      </div>

      <div className="space-y-3">
        {authors.map((auth, index) => (
          <div key={auth.id ?? index} className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-3">
              <input type="text" value={auth.name} onChange={(e) => update(index, 'name', e.target.value)} className="w-40 rounded border border-neutral-200 px-3 py-2 text-sm" placeholder="Nom" />
              <input type="text" value={auth.slug} onChange={(e) => update(index, 'slug', e.target.value)} className="w-40 rounded border border-neutral-200 px-3 py-2 text-sm" placeholder="slug" />
              <input type="text" value={auth.job_title} onChange={(e) => update(index, 'job_title', e.target.value)} className="w-48 rounded border border-neutral-200 px-3 py-2 text-sm" placeholder="Fonction" />
              <input type="text" value={auth.email_public} onChange={(e) => update(index, 'email_public', e.target.value)} className="flex-1 rounded border border-neutral-200 px-3 py-2 text-sm" placeholder="Email public" />
              <label className="flex items-center gap-1.5 text-sm text-neutral-600">
                <input type="checkbox" checked={auth.is_active} onChange={(e) => update(index, 'is_active', e.target.checked)} className="h-4 w-4 accent-ink" />
                Actif
              </label>
              <button onClick={() => save(auth)} disabled={saving} className="rounded-lg bg-ink px-3 py-2 text-xs font-medium text-white hover:bg-ink/90 disabled:opacity-50">
                <Save className="h-3.5 w-3.5" />
              </button>
              {auth.id && (
                <button onClick={() => remove(auth)} className="rounded p-2 text-red-400 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="mt-3 flex gap-3">
              <input type="text" value={auth.photo_path} onChange={(e) => update(index, 'photo_path', e.target.value)} className="w-48 rounded border border-neutral-200 px-3 py-2 text-sm" placeholder="Photo (URL)" />
              <textarea value={auth.bio} onChange={(e) => update(index, 'bio', e.target.value)} rows={2} className="flex-1 rounded border border-neutral-200 px-3 py-2 text-sm" placeholder="Bio" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
