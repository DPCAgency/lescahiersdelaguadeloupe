'use client';

import Link from 'next/link';
import { BookOpen, Eye, Edit3 } from 'lucide-react';

const statusColors: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-600',
  review: 'bg-amber-100 text-amber-700',
  changes_requested: 'bg-red-100 text-red-700',
  ready: 'bg-blue-100 text-blue-700',
  scheduled: 'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-neutral-200 text-neutral-500',
};

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  review: 'En relecture',
  changes_requested: 'Corrections demandées',
  ready: 'Prêt',
  scheduled: 'Programmé',
  published: 'Publié',
  archived: 'Archivé',
};

const roleLabels: Record<string, string> = {
  contributor: 'Contributeur',
  editor: 'Éditeur',
};

interface MesCahiersProps {
  issues: Record<string, unknown>[];
}

export function MesCahiersClient({ issues }: MesCahiersProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-neutral-800">Mes Cahiers</h2>
        <p className="mt-1 text-sm text-neutral-500">Cahiers auxquels vous êtes assigné.</p>
      </div>

      {issues.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-neutral-300" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-neutral-400">Aucun Cahier ne vous est assigné pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => {
            const collabs = (issue.issue_collaborators as { role: string }[]) ?? [];
            const collabRole = collabs[0]?.role ?? 'contributor';
            return (
              <div key={issue.id as string} className="rounded-lg border border-neutral-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Link href={`/admin/cahiers/${issue.id as string}/edit`} className="text-sm font-medium text-neutral-800 hover:text-ink">
                      N°{issue.issue_number as string} — {issue.title as string}
                    </Link>
                    <p className="mt-1 text-xs text-neutral-400">
                      Modifié le {new Date(issue.updated_at as string).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[issue.status as string] ?? ''}`}>
                      {statusLabels[issue.status as string] ?? issue.status}
                    </span>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                      {roleLabels[collabRole] ?? collabRole}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Link href={`/admin/cahiers/${issue.id as string}/edit`} className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50">
                    <Edit3 className="h-3 w-3" /> Ouvrir le Studio
                  </Link>
                  <Link href={`/admin/cahiers/${issue.id as string}/preview`} className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50">
                    <Eye className="h-3 w-3" /> Prévisualiser
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
