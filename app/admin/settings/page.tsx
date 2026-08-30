'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Save, CheckCircle2, AlertCircle } from 'lucide-react';

const settingFields = [
  { key: 'site_name', label: 'Nom du média', type: 'text' },
  { key: 'site_tagline', label: 'Sous-titre', type: 'text' },
  { key: 'site_logo', label: 'Logo (URL)', type: 'text' },
  { key: 'favicon', label: 'Favicon (URL)', type: 'text' },
  { key: 'primary_color', label: 'Couleur principale', type: 'text' },
  { key: 'contact_email', label: 'Email rédaction', type: 'text' },
  { key: 'editorial_signature', label: 'Signature éditoriale', type: 'text' },
  { key: 'footer_text', label: 'Texte du footer', type: 'text' },
];

const featureFlags = [
  { key: 'subscriptions_enabled', label: 'Abonnements activés' },
  { key: 'page_purchase_enabled', label: 'Achat à la page activé' },
  { key: 'full_issue_purchase_enabled', label: 'Achat du cahier complet activé' },
  { key: 'pdf_download_enabled', label: 'Téléchargement PDF activé' },
  { key: 'ai_import_enabled', label: 'Import IA activé' },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const load = useCallback(async () => {
    try {
      const resp = await fetch('/api/admin/settings', { credentials: 'same-origin' });
      if (resp.status === 401) {
        setSaveError('Session expirée. Reconnectez-vous.');
        setLoading(false);
        return;
      }
      if (resp.status === 403) {
        setSaveError('Accès refusé.');
        setLoading(false);
        return;
      }
      if (!resp.ok) {
        setSaveError('Erreur serveur.');
        setLoading(false);
        return;
      }
      const data = await resp.json() as { settings: Record<string, string>; flags: Record<string, boolean> };
      setSettings(data.settings ?? {});
      setFlags(data.flags ?? {});
    } catch {
      setSaveError('Erreur de chargement.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const resp = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ settings, flags }),
      });

      const data = await resp.json() as { success?: boolean; error?: string; flags?: Record<string, boolean> };

      if (!resp.ok || !data.success) {
        throw new Error(data.error ?? 'Erreur inconnue');
      }

      if (data.flags) {
        setFlags(data.flags);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur inconnue');
    }

    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-neutral-800">Paramètres</h2>
          <p className="mt-1 text-sm text-neutral-500">Configuration générale du site.</p>
        </div>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer
        </button>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <p className="text-sm text-green-700">Paramètres enregistrés.</p>
        </div>
      )}

      {saveError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <p className="text-sm text-red-700">Erreur lors de l&apos;enregistrement : {saveError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-4">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-neutral-600">Identité du site</h3>
          {settingFields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-xs font-medium text-neutral-500">{field.label}</label>
              <input
                type="text"
                value={settings[field.key] ?? ''}
                onChange={(e) => setSettings((prev) => ({ ...prev, [field.key]: e.target.value }))}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-4">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-neutral-600">Fonctionnalités</h3>
          <p className="text-xs text-neutral-400">Activez ou désactivez les fonctionnalités du site. Pour la V1, les paiements et l'import IA sont désactivés.</p>
          {featureFlags.map((flag) => (
            <label key={flag.key} className="flex items-center justify-between rounded-lg border border-neutral-100 px-4 py-3">
              <span className="text-sm font-medium text-neutral-700">{flag.label}</span>
              <div className="flex items-center gap-2">
                {!flags[flag.key] && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-red-500">Désactivé</span>
                )}
                <button
                  onClick={() => setFlags((prev) => ({ ...prev, [flag.key]: !prev[flag.key] }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${flags[flag.key] ? 'bg-ink' : 'bg-neutral-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flags[flag.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </label>
          ))}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-700">
              La signature éditoriale « Enquêter • Comprendre • Éclairer • Débattre » est administrable ici mais reste une signature, pas un menu de navigation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
