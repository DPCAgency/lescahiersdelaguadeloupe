'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Loader2, Save } from 'lucide-react';

export default function AdminSeoPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const seoKeys = [
    { key: 'seo_default_title', label: 'Titre par défaut', placeholder: 'Les Cahiers de la Guadeloupe · Revue d\'analyse et d\'investigation' },
    { key: 'seo_default_description', label: 'Description par défaut', placeholder: 'Revue d\'analyse et d\'investigation…' },
    { key: 'seo_og_title', label: 'Open Graph · Titre', placeholder: 'Les Cahiers de la Guadeloupe' },
    { key: 'seo_og_description', label: 'Open Graph · Description', placeholder: 'Enquêter, comprendre, éclairer le débat public.' },
    { key: 'seo_og_image', label: 'Open Graph · Image (URL)', placeholder: '/assets/og-image.jpg' },
    { key: 'seo_robots_index', label: 'Indexation (true/false)', placeholder: 'true' },
    { key: 'seo_robots_follow', label: 'Follow (true/false)', placeholder: 'true' },
  ];

  const load = useCallback(async () => {
    const { data } = await supabase.from('site_settings').select('key, value_json').in('key', seoKeys.map((s) => s.key));
    const map: Record<string, string> = {};
    (data ?? []).forEach((row) => {
      map[row.key] = typeof row.value_json === 'string' ? row.value_json : JSON.stringify(row.value_json ?? '');
    });
    setSettings(map);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    for (const item of seoKeys) {
      const val = settings[item.key] ?? '';
      await supabase.from('site_settings').upsert({ key: item.key, value_json: val });
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-neutral-800">SEO</h2>
          <p className="mt-1 text-sm text-neutral-500">Paramètres SEO globaux du site.</p>
        </div>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer
        </button>
      </div>

      <div className="max-w-2xl space-y-4 rounded-lg border border-neutral-200 bg-white p-6">
        {seoKeys.map((item) => (
          <div key={item.key}>
            <label className="mb-1 block text-xs font-medium text-neutral-500">{item.label}</label>
            <input
              type="text"
              value={settings[item.key] ?? ''}
              onChange={(e) => setSettings((prev) => ({ ...prev, [item.key]: e.target.value }))}
              placeholder={item.placeholder}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </div>
        ))}
        <p className="text-xs text-neutral-400">
          Les articles et Cahiers conservent leurs propres champs SEO. Ces valeurs s'appliquent uniquement aux pages sans SEO dédié.
        </p>
      </div>
    </div>
  );
}
