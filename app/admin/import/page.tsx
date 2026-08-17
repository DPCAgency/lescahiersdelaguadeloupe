'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import {
  UploadCloud, FileText, Loader2, Trash2, ScanLine,
  CheckCircle2, AlertCircle, X, Activity,
} from 'lucide-react';
import {
  MAX_ISSUE_UPLOAD_SIZE,
  ACCEPTED_MIME_TYPES,
  ACCEPTED_EXTENSIONS,
  formatFileSize,
} from '@/lib/imports/constants';

interface ImportJob {
  id: string;
  source_file_path: string;
  source_type: string;
  status: string;
  page_count: number | null;
  progress: number;
  error_message: string | null;
  created_at: string;
  metadata_json: Record<string, unknown> | null;
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

interface UploadProgress {
  state: UploadState;
  percent: number;
  loaded: number;
  total: number;
  error: string | null;
}

const statusLabels: Record<string, string> = {
  uploaded: 'Importé',
  processing: 'En cours',
  needs_review: 'À vérifier',
  validated: 'Validé',
  failed: 'Échec',
};

const statusColors: Record<string, string> = {
  uploaded: 'bg-neutral-100 text-neutral-600',
  processing: 'bg-blue-100 text-blue-700',
  needs_review: 'bg-amber-100 text-amber-700',
  validated: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

function validateFile(file: File): string | null {
  if (file.size > MAX_ISSUE_UPLOAD_SIZE) {
    return `Ce fichier dépasse la taille maximale autorisée de ${formatFileSize(MAX_ISSUE_UPLOAD_SIZE)}.`;
  }
  const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
  if (!ACCEPTED_EXTENSIONS.includes(ext as typeof ACCEPTED_EXTENSIONS[number])) {
    return `Extension non autorisée. Formats acceptés : ${ACCEPTED_EXTENSIONS.join(', ')}.`;
  }
  if (file.type && !ACCEPTED_MIME_TYPES.includes(file.type as typeof ACCEPTED_MIME_TYPES[number])) {
    return `Type de fichier non autorisé. Formats acceptés : PDF, JPG, PNG.`;
  }
  return null;
}


export default function AdminImportPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<Record<string, string | null>>({});
  const [upload, setUpload] = useState<UploadProgress>({
    state: 'idle', percent: 0, loaded: 0, total: 0, error: null,
  });

  const loadJobs = useCallback(async () => {
    try {
      const resp = await fetch('/api/import/jobs', { credentials: 'same-origin' });
      if (resp.ok) {
        const data = await resp.json() as ImportJob[];
        setJobs(data);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const accepted: File[] = [];
    const errors: Record<string, string | null> = {};
    for (const file of Array.from(fileList)) {
      const err = validateFile(file);
      if (err) {
        errors[file.name + file.size] = err;
      } else {
        accepted.push(file);
      }
    }
    setFileErrors(errors);
    setFiles(accepted);
    setUpload({ state: 'idle', percent: 0, loaded: 0, total: 0, error: null });
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    setUpload({ state: 'uploading', percent: 0, loaded: 0, total: totalSize, error: null });

    try {
      const formData = new FormData();
      formData.append('file', files[0]);

      const result = await new Promise<{ success: boolean; jobId?: string; error?: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setUpload({
              state: 'uploading', percent, loaded: e.loaded, total: e.total, error: null,
            });
          }
        };
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && data.success) {
              resolve(data);
            } else {
              resolve({ success: false, error: data.error ?? `Erreur ${xhr.status}` });
            }
          } catch {
            resolve({ success: false, error: 'Réponse serveur invalide.' });
          }
        };
        xhr.onerror = () => {
          resolve({ success: false, error: 'Échec du téléversement. Vérifiez votre connexion.' });
        };
        xhr.open('POST', `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/upload-import`);
        xhr.setRequestHeader('Authorization', `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`);
        xhr.send(formData);
      });

      if (!result.success || !result.jobId) {
        setUpload({
          state: 'error', percent: 0, loaded: 0, total: 0,
          error: result.error ?? 'Échec de l\'upload du fichier.',
        });
        return;
      }

      setUpload({
        state: 'done', percent: 100, loaded: totalSize, total: totalSize, error: null,
      });

      setFiles([]);
      setFileErrors({});
      await loadJobs();
      router.push(`/admin/import/${result.jobId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('[IMPORT ERROR]', { step: 'upload', message: msg });
      setUpload({
        state: 'error', percent: 0, loaded: 0, total: 0,
        error: `Échec de l'upload du fichier: ${msg}`,
      });
    }
  };

  const handleDelete = async (job: ImportJob) => {
    if (!confirm(`Supprimer cet import ?`)) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/storage-admin?action=delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ jobId: job.id }),
      });
    } catch (err) {
      console.error('[IMPORT ERROR]', { step: 'delete', message: err instanceof Error ? err.message : String(err) });
    }
    await loadJobs();
  };

  const hasErrors = Object.values(fileErrors).some(Boolean);
  const [providerTest, setProviderTest] = useState<{ status: 'idle' | 'testing' | 'done'; available: boolean; message: string }>({ status: 'idle', available: false, message: '' });

  const testProvider = async () => {
    setProviderTest({ status: 'testing', available: false, message: '' });
    try {
      const resp = await fetch('/api/import/test-provider', { method: 'POST' });
      const data = await resp.json() as { available: boolean; message: string };
      setProviderTest({ status: 'done', available: data.available, message: data.message });
    } catch {
      setProviderTest({ status: 'done', available: false, message: 'Service indisponible — erreur de connexion' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-neutral-800">Import intelligent</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Importez un Cahier au format PDF ou en images, puis validez l'extraction.
        </p>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragOver ? 'border-ink bg-neutral-50' : 'border-neutral-300 bg-white'
        }`}
      >
        <UploadCloud className="mx-auto h-10 w-10 text-neutral-400" strokeWidth={1.5} />
        <p className="mt-3 text-sm font-medium text-neutral-600">
          Glissez vos fichiers ici ou cliquez pour sélectionner
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          PDF, JPG, JPEG ou PNG — {formatFileSize(MAX_ISSUE_UPLOAD_SIZE)} maximum
        </p>
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90">
          <FileText className="h-4 w-4" />
          Sélectionner des fichiers
          <input
            type="file"
            multiple
            accept={ACCEPTED_EXTENSIONS.join(',')}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </label>

        {/* Validation errors */}
        {hasErrors && (
          <div className="mt-4 space-y-1">
            {Object.entries(fileErrors).filter(([, v]) => v).map(([key, msg]) => (
              <div key={key} className="flex items-center justify-center gap-2 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5" />
                {msg}
              </div>
            ))}
          </div>
        )}

        {/* Selected files */}
        {files.length > 0 && upload.state !== 'uploading' && upload.state !== 'done' && (
          <div className="mt-4 space-y-2">
            {files.map((file, i) => (
              <div key={i} className="flex items-center justify-between rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-left">
                <div>
                  <p className="text-xs font-medium text-neutral-700">{file.name}</p>
                  <p className="text-[10px] text-neutral-400">
                    {formatFileSize(file.size)} · {file.type || 'inconnu'}
                  </p>
                </div>
                <button
                  onClick={() => removeFile(i)}
                  className="rounded p-1 text-red-400 hover:bg-red-50"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <p className="text-xs text-neutral-400">{files.length} fichier(s) sélectionné(s)</p>
            <button
              onClick={handleUpload}
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90"
            >
              <UploadCloud className="h-4 w-4" />
              Importer le Cahier
            </button>
          </div>
        )}

        {/* Upload progress */}
        {upload.state === 'uploading' && (
          <div className="mt-6 mx-auto max-w-md space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-neutral-700">Téléversement du Cahier</span>
              <span className="text-neutral-500">{upload.percent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-ink transition-all duration-300"
                style={{ width: `${upload.percent}%` }}
              />
            </div>
            <p className="text-xs text-neutral-400">
              {formatFileSize(upload.loaded)} / {formatFileSize(upload.total)}
            </p>
          </div>
        )}

        {/* Upload done */}
        {upload.state === 'done' && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Téléversement terminé
          </div>
        )}

        {/* Upload error */}
        {upload.state === 'error' && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {upload.error}
          </div>
        )}
      </div>

      {/* Provider test */}
      <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3">
        <Activity className="h-4 w-4 text-neutral-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600">Service d'analyse documentaire</p>
          {providerTest.status === 'done' && (
            <p className={`text-xs ${providerTest.available ? 'text-green-600' : 'text-red-600'}`}>
              {providerTest.message}
            </p>
          )}
        </div>
        <button
          onClick={testProvider}
          disabled={providerTest.status === 'testing'}
          className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
        >
          {providerTest.status === 'testing' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
          Tester le service
        </button>
      </div>

      {/* Recent imports */}
      <div>
        <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-neutral-600">
          Imports récents
        </h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-lg border border-neutral-200 bg-white py-8 text-center">
            <ScanLine className="mx-auto h-8 w-8 text-neutral-300" strokeWidth={1.5} />
            <p className="mt-2 text-sm text-neutral-400">Aucun import pour le moment.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Fichier</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Pages</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Progression</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-sm text-neutral-700">
                      {job.source_file_path.split('/').pop()}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-500">{job.source_type}</td>
                    <td className="px-4 py-3 text-sm text-neutral-500">{job.page_count ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-neutral-400">
                      {new Date(job.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[job.status] ?? ''}`}>
                        {statusLabels[job.status] ?? job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-neutral-200">
                        <div className="h-full rounded-full bg-ink" style={{ width: `${job.progress}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {job.status === 'needs_review' && (
                          <button
                            onClick={() => router.push(`/admin/import/${job.id}/review`)}
                            className="text-xs font-medium text-ink hover:underline"
                          >
                            Reprendre
                          </button>
                        )}
                        {(job.status === 'uploaded' || job.status === 'processing' || job.status === 'validated') && (
                          <button
                            onClick={() => router.push(`/admin/import/${job.id}`)}
                            className="text-xs font-medium text-ink hover:underline"
                          >
                            Voir
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(job)}
                          className="rounded p-1 text-red-400 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
