'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Loader2, Plus, Save, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

interface Category {
  id?: string;
  name: string;
  slug: string;
  description: string;
  position: number;
  is_active: boolean;
}

export default function AdminRubriquesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').order('position');
    setCategories(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = (index: number, field: keyof Category, value: unknown) => {
    setCategories((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const save = async (cat: Category) => {
    setSaving(true);
    const payload = {
      name: cat.name,
      slug: cat.slug,
      description: cat.description || null,
      position: cat.position,
      is_active: cat.is_active,
    };
    if (cat.id) {
      await supabase.from('categories').update(payload).eq('id', cat.id);
    } else {
      const { data } = await supabase.from('categories').insert(payload).select('id').single();
      if (data) cat.id = data.id;
    }
    setSaving(false);
  };

  const move = async (index: number, dir: 'up' | 'down') => {
    const swap = dir === 'up' ? index - 1 : index + 1;
    if (swap < 0 || swap >= categories.length) return;
    const a = categories[index];
    const b = categories[swap];
    await Promise.all([
      supabase.from('categories').update({ position: b.position }).eq('id', a.id),
      supabase.from('categories').update({ position: a.position }).eq('id', b.id),
    ]);
    setCategories((prev) => {
      const next = [...prev];
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
  };

  const addNew = () => {
    setCategories([...categories, { name: '', slug: '', description: '', position: categories.length + 1, is_active: true }]);
  };

  const remove = async (cat: Category) => {
    if (!cat.id) return;
    if (!confirm(`Supprimer "${cat.name}" ?`)) return;
    await supabase.from('categories').delete().eq('id', cat.id);
    await load();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-neutral-800">Rubriques</h2>
          <p className="mt-1 text-sm text-neutral-500">Gérez les catégories éditoriales.</p>
        </div>
        <button onClick={addNew} className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90">
          <Plus className="h-4 w-4" /> Nouvelle rubrique
        </button>
      </div>

      <div className="space-y-3">
        {categories.map((cat, index) => (
          <div key={cat.id ?? index} className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4">
            <div className="flex flex-col">
              <button onClick={() => move(index, 'up')} disabled={index === 0} className="rounded p-0.5 text-neutral-400 hover:bg-neutral-100 disabled:opacity-30">
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => move(index, 'down')} disabled={index === categories.length - 1} className="rounded p-0.5 text-neutral-400 hover:bg-neutral-100 disabled:opacity-30">
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
            <input type="text" value={cat.name} onChange={(e) => update(index, 'name', e.target.value)} className="w-48 rounded border border-neutral-200 px-3 py-2 text-sm" placeholder="Nom" />
            <input type="text" value={cat.slug} onChange={(e) => update(index, 'slug', e.target.value)} className="w-48 rounded border border-neutral-200 px-3 py-2 text-sm" placeholder="slug" />
            <input type="text" value={cat.description} onChange={(e) => update(index, 'description', e.target.value)} className="flex-1 rounded border border-neutral-200 px-3 py-2 text-sm" placeholder="Description" />
            <label className="flex items-center gap-1.5 text-sm text-neutral-600">
              <input type="checkbox" checked={cat.is_active} onChange={(e) => update(index, 'is_active', e.target.checked)} className="h-4 w-4 accent-ink" />
              Active
            </label>
            <button onClick={() => save(cat)} disabled={saving} className="rounded-lg bg-ink px-3 py-2 text-xs font-medium text-white hover:bg-ink/90 disabled:opacity-50">
              <Save className="h-3.5 w-3.5" />
            </button>
            {cat.id && (
              <button onClick={() => remove(cat)} className="rounded p-2 text-red-400 hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
