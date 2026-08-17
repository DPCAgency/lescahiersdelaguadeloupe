'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Upload, Loader2 } from 'lucide-react';

export default function NewCahierPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createManual = async () => {
    setCreating(true);
    setError(null);
    try {
      const resp = await fetch('/api/admin/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ title: 'Nouveau Cahier' }),
      });

      if (resp.status === 401) {
        router.push('/connexion?redirect=/admin/cahiers/new');
        return;
      }
      if (resp.status === 403) {
        setError('Accès refusé. Permissions admin requises.');
        setCreating(false);
        return;
      }
      if (!resp.ok) {
        const data = await resp.json() as { error?: string };
        setError(data.error ?? 'Échec de la création');
        setCreating(false);
        return;
      }

      const data = await resp.json() as { id: string };
      router.push(`/admin/cahiers/${data.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/admin/cahiers')} className="rounded-lg border border-neutral-200 bg-white p-2 text-neutral-500 hover:bg-neutral-50">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="font-display text-2xl font-bold text-neutral-800">Nouveau Cahier</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Manual mode */}
        <div className="group flex flex-col rounded-xl border border-neutral-200 bg-white p-8 transition-all hover:border-ink hover:shadow-md">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-ink/5 text-ink">
            <FileText className="h-7 w-7" />
          </div>
          <h3 className="mt-5 font-display text-xl font-bold text-neutral-800">Créer manuellement</h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-500">
            Construisez votre Cahier page par page avec le studio éditorial. Ajoutez des titres, textes, images, citations, encadrés. Fonctionne sans IA ni import PDF.
          </p>
          <button
            onClick={createManual}
            disabled={creating}
            className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-medium text-white hover:bg-ink/90 disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Commencer la création
          </button>
        </div>

        {/* Import mode */}
        <div className="group flex flex-col rounded-xl border border-neutral-200 bg-white p-8 transition-all hover:border-ink hover:shadow-md">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-ink/5 text-ink">
            <Upload className="h-7 w-7" />
          </div>
          <h3 className="mt-5 font-display text-xl font-bold text-neutral-800">Importer un PDF avec IA</h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-500">
            Téléversez un PDF et laissez l'IA extraire automatiquement les blocs éditoriaux. Vérifiez et corrigez le contenu avant publication.
          </p>
          <button
            onClick={() => router.push('/admin/import')}
            className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <Upload className="h-4 w-4" />
            Importer un PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
