'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Loader2, Plus, Save, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

interface NavItem {
  id?: string;
  location: string;
  label: string;
  url: string;
  position: number;
  is_visible: boolean;
}

const locations = [
  { value: 'header', label: 'Header' },
  { value: 'footer', label: 'Footer' },
  { value: 'secondary', label: 'Menu secondaire' },
];

export default function AdminNavigationPage() {
  const [items, setItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('header');

  const load = useCallback(async () => {
    const { data } = await supabase.from('navigation').select('*').order('position');
    setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((i) => i.location === filter);

  const update = (id: string, field: keyof NavItem, value: unknown) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const save = async (item: NavItem) => {
    setSaving(true);
    const payload = { location: item.location, label: item.label, url: item.url, position: item.position, is_visible: item.is_visible };
    if (item.id) {
      await supabase.from('navigation').update(payload).eq('id', item.id);
    } else {
      const { data } = await supabase.from('navigation').insert(payload).select('id').single();
      if (data) item.id = data.id;
    }
    setSaving(false);
  };

  const addNew = () => {
    const newItem: NavItem = { location: filter, label: '', url: '', position: filtered.length + 1, is_visible: true };
    setItems([...items, newItem]);
  };

  const remove = async (item: NavItem) => {
    if (!item.id) return;
    if (!confirm(`Supprimer "${item.label}" ?`)) return;
    await supabase.from('navigation').delete().eq('id', item.id);
    await load();
  };

  const move = async (item: NavItem, dir: 'up' | 'down') => {
    const sorted = [...filtered].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex((i) => i.id === item.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    await Promise.all([
      supabase.from('navigation').update({ position: b.position }).eq('id', a.id!),
      supabase.from('navigation').update({ position: a.position }).eq('id', b.id!),
    ]);
    await load();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-neutral-800">Navigation</h2>
        <p className="mt-1 text-sm text-neutral-500">Gérez les menus du site.</p>
      </div>

      <div className="flex gap-2">
        {locations.map((loc) => (
          <button
            key={loc.value}
            onClick={() => setFilter(loc.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${filter === loc.value ? 'bg-ink text-white' : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'}`}
          >
            {loc.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((item) => (
          <div key={item.id ?? `new-${item.position}`} className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4">
            <div className="flex flex-col">
              <button onClick={() => item.id && move(item, 'up')} className="rounded p-0.5 text-neutral-400 hover:bg-neutral-100">
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => item.id && move(item, 'down')} className="rounded p-0.5 text-neutral-400 hover:bg-neutral-100">
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
            <input type="text" value={item.label} onChange={(e) => item.id && update(item.id, 'label', e.target.value)} className="w-40 rounded border border-neutral-200 px-3 py-2 text-sm" placeholder="Label" />
            <input type="text" value={item.url} onChange={(e) => item.id && update(item.id, 'url', e.target.value)} className="flex-1 rounded border border-neutral-200 px-3 py-2 text-sm" placeholder="URL" />
            <label className="flex items-center gap-1.5 text-sm text-neutral-600">
              <input type="checkbox" checked={item.is_visible} onChange={(e) => item.id && update(item.id, 'is_visible', e.target.checked)} className="h-4 w-4 accent-ink" />
              Visible
            </label>
            <button onClick={() => save(item)} disabled={saving} className="rounded-lg bg-ink px-3 py-2 text-xs font-medium text-white hover:bg-ink/90 disabled:opacity-50">
              <Save className="h-3.5 w-3.5" />
            </button>
            {item.id && (
              <button onClick={() => remove(item)} className="rounded p-2 text-red-400 hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        <button onClick={addNew} className="flex items-center gap-2 rounded-lg border border-dashed border-neutral-300 px-4 py-2 text-sm text-neutral-500 hover:border-ink hover:text-ink">
          <Plus className="h-4 w-4" /> Ajouter un lien
        </button>
      </div>
    </div>
  );
}
