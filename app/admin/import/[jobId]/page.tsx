'use client';

import { useEffect, useState, useCallback } from 'react';
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
}

interface ProgressStep {
  label: string;
  status: 'done' | 'active' | 'pending';
  percent: number;
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
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [steps, setSteps] = useState<ProgressStep[]>([
    { label: 'Téléversement du fichier', status: 'done', percent: 100 },
    { label: 'Téléchargement du fichier source', status: 'pending', percent: 0 },
    { label: 'Analyse documentaire (OCR + structure)', status: 'pending', percent: 0 },
    { label: 'Extraction des blocs éditoriaux', status: 'pending', percent: 0 },
    { label: 'Identification des articles potentiels', status: 'pending', percent: 0 },
  ]);

  const fileSize = job?.metadata_json
    ? (job.metadata_json as { file_size?: number }).file_size ?? null
    : null;

  const loadJob = useCallback(async () => {
    console.log('[IMPORT DEBUG]', { jobId, pathname: window.location.pathname });
    setDebugInfo(`JOB ID: ${jobId}`);
    try {
      const result = await safeJsonFetch(`/api/import/jobs/${jobId}`, { credentials: 'same-origin' });
      setDebugInfo(prev => `${prev} | API STATUS: ${result.status}`);

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
        setDebugInfo(prev => `${prev} | API ERROR: ${result.error ?? 'unknown'}`);
        setLoadError('server');
        setLoading(false);
        return;
      }

      const data = result.data as ImportJob;
      setDebugInfo(prev => `${prev} | JOB FOUND: ${data.id} status=${data.status}`);
      setJob(data);
      setLoading(false);

      if (data?.status === 'needs_review') {
        router.push(`/admin/import/${jobId}/review`);
      }
    } catch (err) {
      setDebugInfo(prev => `${prev} | NETWORK ERROR: ${err instanceof Error ? err.message : 'unknown'}`);
      setLoadError('server');
      setLoading(false);
    }
  }, [jobId, router]);

  useEffect(() => { loadJob(); }, [loadJob]);

  const updateStep = (index: number, status: ProgressStep['status'], percent: number) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, status, percent } : s)));
  };

  const startAnalysis = async () => {
    setAnalyzing(true);
    setError(null);

    updateStep(1, 'active', 50);
    await new Promise((r) => setTimeout(r, 500));
    updateStep(1, 'done', 100);

    updateStep(2, 'active', 30);
    updateStep(3, 'active', 20);

    try {
      const result = await safeJsonFetch('/api/import/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      if (!result.ok) {
        throw new Error(result.error ?? `Échec de l'analyse (HTTP ${result.status})`);
      }

      const data = result.data as { success?: boolean; error?: string; mode?: string };

      if (!data.success) {
        throw new Error(data.error ?? 'Échec de l\'analyse');
      }

      updateStep(2, 'done', 100);
      updateStep(3, 'done', 100);
      updateStep(4, 'done', 100);

      await new Promise((r) => setTimeout(r, 500));
      router.push(`/admin/import/${jobId}/review`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(msg);
      updateStep(2, 'pending', 0);
      updateStep(3, 'pending', 0);
      updateStep(4, 'pending', 0);
      await loadJob();
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
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 font-mono text-xs text-neutral-500">
          DEBUG: {debugInfo}
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
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 font-mono text-xs text-neutral-500">
          DEBUG: {debugInfo}
        </div>
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

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 font-mono text-xs text-neutral-400">
        DEBUG JOB ID: {jobId}
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
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center shrink-0">
                {step.status === 'done' ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : step.status === 'active' ? (
                  <Loader2 className="h-6 w-6 animate-spin text-ink" />
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-neutral-200" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${step.status === 'pending' ? 'text-neutral-400' : 'text-neutral-700'}`}>
                  {step.label}
                </p>
                {step.status === 'active' && (
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-neutral-200">
                    <div className="h-full rounded-full bg-ink transition-all duration-500" style={{ width: `${step.percent}%` }} />
                  </div>
                )}
                {step.status === 'done' && (
                  <p className="text-xs text-green-600">Terminé</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {analyzing && (
          <p className="mt-6 text-xs text-neutral-400">
            L'analyse documentaire est en cours. Pour les PDF volumineux, cela peut prendre plusieurs minutes.
          </p>
        )}
      </div>
    </div>
  );
}
