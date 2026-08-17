'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { formatFileSize } from '@/lib/imports/constants';
import { safeJsonFetch } from '@/lib/utils/safe-fetch';

interface ImportJob {
  id: string;
  source_file_path: string;
  source_type: string;
  status: string;
  page_count: number | null;
  progress: number;
  error_message: string | null;
  metadata_json: Record<string, unknown> | null;
  total_pages: number | null;
  processed_pages: number | null;
  failed_pages: number | null;
  current_page: number | null;
  last_error: string | null;
}

type LoadError = 'session' | 'forbidden' | 'not_found' | 'server' | null;

export default function ImportJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<ImportJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<LoadError>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fileSize = job?.metadata_json
    ? (job.metadata_json as { file_size?: number }).file_size ?? null
    : null;

  const loadJob = useCallback(async () => {
    try {
      const result = await safeJsonFetch(`/api/import/jobs/${jobId}`, { credentials: 'same-origin' });

      if (result.status === 401) {
        setLoadError('session');
        setLoading(false);
        return;
      }
      if (result.status === 403) {
        setLoadError('forbidden');
        setLoading(false);
        return;
      }
      if (result.status === 404) {
        setLoadError('not_found');
        setLoading(false);
        return;
      }
      if (!result.ok) {
        setLoadError('server');
        setLoading(false);
        return;
      }

      const data = result.data as ImportJob;
      setJob(data);
      setLoading(false);

      if (data?.status === 'needs_review') {
        if (pollRef.current) clearInterval(pollRef.current);
        router.push(`/admin/import/${jobId}/review`);
      }

      if (data?.status === 'failed') {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch {
      setLoadError('server');
      setLoading(false);
    }
  }, [jobId, router]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  // Poll while processing
  useEffect(() => {
    if (job?.status === 'processing' && !pollRef.current) {
      pollRef.current = setInterval(loadJob, 2500);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [job?.status, loadJob]);

  const startAnalysis = async () => {
    setAnalyzing(true);
    setError(null);

    try {
      const result = await safeJsonFetch('/api/import/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      if (!result.ok) {
        throw new Error(result.error ?? `Échec du démarrage (HTTP ${result.status})`);
      }

      const data = result.data as { success?: boolean; error?: string; status?: string };

      if (!data.success) {
        throw new Error(data.error ?? 'Échec du démarrage de l\'analyse');
      }

      // Start polling
      if (!pollRef.current) {
        pollRef.current = setInterval(loadJob, 2500);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(msg);
    }

    setAnalyzing(false);
  };

  useEffect(() => {
    if (job?.status === 'uploaded' && !analyzing && !error) {
      startAnalysis();
    }
  }, [job, analyzing, error]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (loadError) {
    const messages: Record<NonNullable<LoadError>, string> = {
      session: 'Session expirée. Reconnectez-vous.',
      forbidden: 'Accès refusé. Vous n\'avez pas les permissions nécessaires.',
      not_found: 'Import introuvable.',
      server: 'Erreur serveur. Réessayez dans un instant.',
    };
    return (
      <div className="space-y-4">
        <button onClick={() => router.push('/admin/import')} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <p className="text-sm text-amber-700">{messages[loadError]}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.push('/admin/import')} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <p className="text-sm text-neutral-400">Import introuvable.</p>
      </div>
    );
  }

  if (job.status === 'failed') {
    return (
      <div className="space-y-4">
        <button onClick={() => router.push('/admin/import')} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <h3 className="mt-2 font-display text-lg font-semibold text-red-700">Échec de l'analyse</h3>
          <p className="mt-1 text-sm text-red-600">{job.error_message ?? 'Erreur inconnue'}</p>
          {job.last_error && (
            <p className="mt-2 rounded bg-red-100 p-2 font-mono text-xs text-red-700">{job.last_error}</p>
          )}
          <button
            onClick={startAnalysis}
            disabled={analyzing}
            className="mt-4 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Relancer l'analyse
          </button>
        </div>
      </div>
    );
  }

  const isProcessing = job.status === 'processing';
  const totalPages = job.total_pages ?? job.page_count ?? 0;
  const processedPages = job.processed_pages ?? 0;
  const failedPages = job.failed_pages ?? 0;
  const currentPage = job.current_page ?? 0;
  const progressPercent = isProcessing && totalPages > 0
    ? Math.round(((processedPages + failedPages) / totalPages) * 100)
    : job.progress;

  const steps = [
    { label: 'Téléversement du fichier', done: true },
    { label: 'Téléchargement du fichier source', done: true },
    { label: 'Rendu PDF des pages', done: progressPercent >= 25 },
    { label: 'Analyse documentaire (IA)', done: !isProcessing && job.status === 'needs_review', active: isProcessing },
    { label: 'Extraction des blocs éditoriaux', done: !isProcessing && job.status === 'needs_review', active: isProcessing },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/admin/import')} className="rounded-lg border border-neutral-200 bg-white p-2 text-neutral-500 hover:bg-neutral-50">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="font-display text-2xl font-bold text-neutral-800">Analyse du Cahier</h2>
          <p className="mt-1 text-sm text-neutral-500">
            {job.source_file_path.split('/').pop()}
            {fileSize !== null && ` · ${formatFileSize(fileSize)}`}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <p className="text-sm text-amber-700">{error}</p>
          </div>
        </div>
      )}

      <div className="max-w-2xl rounded-lg border border-neutral-200 bg-white p-6">
        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center shrink-0">
                {step.done ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : step.active ? (
                  <Loader2 className="h-6 w-6 animate-spin text-ink" />
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-neutral-200" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${step.done || step.active ? 'text-neutral-700' : 'text-neutral-400'}`}>
                  {step.label}
                </p>
                {step.done && (
                  <p className="text-xs text-green-600">Terminé</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {isProcessing && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-neutral-700">
                {totalPages > 0
                  ? `Analyse documentaire — ${processedPages + failedPages} / ${totalPages} pages`
                  : 'Initialisation...'}
              </span>
              <span className="text-neutral-500">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-ink transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {totalPages > 0 && (
              <div className="flex items-center gap-4 text-xs text-neutral-400">
                <span>Page en cours: {currentPage} / {totalPages}</span>
                {failedPages > 0 && <span className="text-red-500">{failedPages} page(s) en échec</span>}
              </div>
            )}
          </div>
        )}

        {isProcessing && (
          <p className="mt-6 text-xs text-neutral-400">
            L'analyse documentaire est en cours. Le rendu PDF et l'analyse IA sont traités en arrière-plan.
            Cette page se met à jour automatiquement.
          </p>
        )}

        {job.status === 'needs_review' && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Analyse terminée
            </div>
            <button
              onClick={() => router.push(`/admin/import/${jobId}/review`)}
              className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90"
            >
              Vérifier le contenu extrait
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
