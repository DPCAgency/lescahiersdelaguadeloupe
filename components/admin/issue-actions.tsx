'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit3, Eye, Trash2, Archive, Loader2 } from 'lucide-react';

interface IssueActionsProps {
  issueId: string;
  status: string;
  title: string;
}

export default function IssueActions({ issueId, status, title }: IssueActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async () => {
    const isPublished = status === 'published';
    const isArchived = status === 'archived';

    let confirmMsg: string;
    if (isPublished) {
      confirmMsg = 'Archiver ce Cahier publié ?\nIl ne sera plus visible sur le site public.';
    } else if (isArchived) {
      confirmMsg = `Supprimer définitivement le Cahier « ${title} » ?\nSes pages et son PDF associé seront également supprimés.`;
    } else {
      confirmMsg = `Supprimer définitivement le Cahier « ${title} » ?\nSes pages et son PDF associé seront également supprimés.`;
    }

    if (!confirm(confirmMsg)) return;

    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/admin/issues/${issueId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error ?? `Erreur HTTP ${resp.status}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de l\'action');
    }
    setLoading(false);
  };

  const isArchived = status === 'archived';
  const actionLabel = status === 'published' ? 'Archiver' : isArchived ? 'Supprimer déf.' : 'Supprimer';
  const ActionIcon = status === 'published' ? Archive : Trash2;
  const actionColor = status === 'published'
    ? 'text-amber-600 hover:text-amber-700'
    : 'text-red-500 hover:text-red-600';

  return (
    <div className="flex items-center gap-2">
      {!isArchived && (
        <>
          <Link href={`/admin/cahiers/${issueId}/edit`} className="flex items-center gap-1 text-xs font-medium text-ink hover:underline">
            <Edit3 className="h-3 w-3" /> Studio
          </Link>
          <Link href={`/admin/cahiers/${issueId}/preview`} className="flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-neutral-600">
            <Eye className="h-3 w-3" /> Aperçu
          </Link>
        </>
      )}
      {isArchived && (
        <Link href={`/admin/cahiers/${issueId}/preview`} className="flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-neutral-600">
          <Eye className="h-3 w-3" /> Voir
        </Link>
      )}
      <button
        onClick={handleAction}
        disabled={loading}
        className={`flex items-center gap-1 text-xs font-medium ${actionColor} hover:underline disabled:opacity-50`}
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ActionIcon className="h-3 w-3" />}
        {actionLabel}
      </button>
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </div>
  );
}
