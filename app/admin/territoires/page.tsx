'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';

interface Territory {
  id?: string;
  name: string;
  slug: string;
  type: string;
  description: string;
  cover_image_path: string;
  is_active: boolean;
}

const territoryTypes = [
  { value: 'commune', label: 'Commune' },
  { value: 'archipel', label: 'Archipel' },
  { value: 'zone', label: 'Zone' },
  { value: 'territoire', label: 'Territoire' },
];

export default function AdminTerritoiresPage() {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('territories').select('*').order('name');
    setTerritories(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = (index: number, field: keyof Territory, value: unknown) => {
    setTerritories((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };

  const save = async (terr: Territory) => {
    setSaving(true);
    const payload = {
      name: terr.name,
      slug: terr.slug,
      type: terr.type || 'commune',
      description: terr.description || null,
      cover_image_path: terr.cover_image_path || null,
      is_active: terr.is_active,
    };
    if (terr.id) {
      await supabase.from('territories').update(payload).eq('id', terr.id);
    } else {
      const { data } = await supabase.from('territories').insert(payload).select('id').single();
      if (data) terr.id = data.id;
    }
    setSaving(false);
  };

  const addNew = () => {
    setTerritories([...territories, { name: '', slug: '', type: 'commune', description: '', cover_image_path: '', is_active: true }]);
  };

  const remove = async (terr: Territory) => {
    if (!terr.id) return;
    if (!confirm(`Supprimer "${terr.name}" ?`)) return;
    await supabase.from('territories').delete().eq('id', terr.id);
    await load();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-neutral-800">Territoires</h2>
          <p className="mt-1 text-sm text-neutral-500">Gérez les communes et territoires.</p>
        </div>
        <button onClick={addNew} className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90">
          <Plus className="h-4 w-4" /> Nouveau territoire
        </button>
      </div>

      <div className="space-y-3">
        {territories.map((terr, index) => (
          <div key={terr.id ?? index} className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4">
            <input type="text" value={terr.name} onChange={(e) => update(index, 'name', e.target.value)} className="w-40 rounded border border-neutral-200 px-3 py-2 text-sm" placeholder="Nom" />
            <input type="text" value={terr.slug} onChange={(e) => update(index, 'slug', e.target.value)} className="w-40 rounded border border-neutral-200 px-3 py-2 text-sm" placeholder="slug" />
            <select value={terr.type} onChange={(e) => update(index, 'type', e.target.value)} className="rounded border border-neutral-200 px-3 py-2 text-sm">
              {territoryTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input type="text" value={terr.description} onChange={(e) => update(index, 'description', e.target.value)} className="flex-1 rounded border border-neutral-200 px-3 py-2 text-sm" placeholder="Description" />
            <input type="text" value={terr.cover_image_path} onChange={(e) => update(index, 'cover_image_path', e.target.value)} className="w-48 rounded border border-neutral-200 px-3 py-2 text-sm" placeholder="Image (URL)" />
            <label className="flex items-center gap-1.5 text-sm text-neutral-600">
              <input type="checkbox" checked={terr.is_active} onChange={(e) => update(index, 'is_active', e.target.checked)} className="h-4 w-4 accent-ink" />
              Actif
            </label>
            <button onClick={() => save(terr)} disabled={saving} className="rounded-lg bg-ink px-3 py-2 text-xs font-medium text-white hover:bg-ink/90 disabled:opacity-50">
              <Save className="h-3.5 w-3.5" />
            </button>
            {terr.id && (
              <button onClick={() => remove(terr)} className="rounded p-2 text-red-400 hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
