'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Eye, EyeOff, ChevronUp, ChevronDown, Save, Loader2 } from 'lucide-react';

interface HomepageSection {
  id: string;
  type: string;
  position: number;
  is_visible: boolean;
  title: string | null;
  settings_json: Record<string, unknown> | null;
}

const sectionLabels: Record<string, string> = {
  hero: 'Grande Une',
  who_decides: 'Qui décide ?',
  editorial_intro: 'Introduction éditoriale',
  dossier: 'Le dossier',
  key_figures: 'Chiffres clés',
  timeline: 'Chronologie',
  central_question: 'Question centrale',
  latest_investigations: 'Dernières enquêtes',
  analysis: 'Analyses & décryptages',
  territories: 'Territoires',
  latest_issue: 'Dernier Cahier',
  method: 'Notre méthode',
  newsletter: 'Newsletter',
};

export default function HomepageAdminPage() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editJson, setEditJson] = useState('');

  const loadSections = useCallback(async () => {
    const { data, error } = await supabase
      .from('homepage_sections')
      .select('*')
      .order('position', { ascending: true });
    if (error) {
      console.error('Error loading sections:', error);
    }
    setSections(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  const toggleVisibility = async (id: string, current: boolean) => {
    await supabase.from('homepage_sections').update({ is_visible: !current }).eq('id', id);
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, is_visible: !current } : s)));
  };

  const moveSection = async (id: string, direction: 'up' | 'down') => {
    const sorted = [...sections].sort((a, b) => a.position - b.position);
    const index = sorted.findIndex((s) => s.id === id);
    if (index < 0) return;
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[swapIndex];
    const aPos = a.position;
    const bPos = b.position;
    await Promise.all([
      supabase.from('homepage_sections').update({ position: bPos }).eq('id', a.id),
      supabase.from('homepage_sections').update({ position: aPos }).eq('id', b.id),
    ]);
    setSections((prev) =>
      prev
        .map((s) => {
          if (s.id === a.id) return { ...s, position: bPos };
          if (s.id === b.id) return { ...s, position: aPos };
          return s;
        })
        .sort((x, y) => x.position - y.position),
    );
  };

  const startEdit = (section: HomepageSection) => {
    setEditingSection(section.id);
    setEditJson(JSON.stringify(section.settings_json ?? {}, null, 2));
  };

  const saveEdit = async () => {
    if (!editingSection) return;
    setSaving(true);
    try {
      const parsed = JSON.parse(editJson);
      await supabase.from('homepage_sections').update({ settings_json: parsed }).eq('id', editingSection);
      setSections((prev) =>
        prev.map((s) => (s.id === editingSection ? { ...s, settings_json: parsed } : s)),
      );
      setEditingSection(null);
    } catch {
      alert('JSON invalide. Vérifiez la syntaxe.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  const sorted = [...sections].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-neutral-800">Gestion de la Une</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Réorganisez, masquez et modifiez le contenu de chaque section de la page d'accueil.
        </p>
      </div>

      <div className="space-y-3">
        {sorted.map((section, index) => (
          <div
            key={section.id}
          >
            <div
              className={`flex items-center justify-between rounded-lg border bg-white p-4 ${
                section.is_visible ? 'border-neutral-200' : 'border-neutral-200 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded bg-neutral-100 text-xs font-bold text-neutral-500">
                  {section.position}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-800">
                    {sectionLabels[section.type] ?? section.type}
                  </h3>
                  {section.title && <p className="text-xs text-neutral-400">{section.title}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveSection(section.id, 'up')}
                  disabled={index === 0}
                  className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-30"
                  title="Monter"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => moveSection(section.id, 'down')}
                  disabled={index === sorted.length - 1}
                  className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-30"
                  title="Descendre"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toggleVisibility(section.id, section.is_visible)}
                  className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                  title={section.is_visible ? 'Masquer' : 'Afficher'}
                >
                  {section.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => startEdit(section)}
                  className="ml-2 rounded bg-ink px-3 py-1.5 text-xs font-medium text-white hover:bg-ink/90"
                >
                  Modifier
                </button>
              </div>
            </div>

            {editingSection === section.id && (
              <div className="mt-2 rounded-lg border border-neutral-300 bg-neutral-50 p-4">
                <label className="mb-2 block text-xs font-medium text-neutral-500">
                  Contenu JSON de la section
                </label>
                <textarea
                  value={editJson}
                  onChange={(e) => setEditJson(e.target.value)}
                  rows={16}
                  className="w-full rounded border border-neutral-300 bg-white p-3 font-mono text-xs text-neutral-700"
                  spellCheck={false}
                />
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="flex items-center gap-2 rounded bg-ink px-4 py-2 text-xs font-medium text-white hover:bg-ink/90 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setEditingSection(null)}
                    className="rounded border border-neutral-300 px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
