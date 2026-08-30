import Link from 'next/link';
import { Plus, BookOpen } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase/server';
import IssueActions from '@/components/admin/issue-actions';

export const dynamic = 'force-dynamic';

export default async function AdminCahiersPage() {
  const { data: issues } = await supabaseAdmin
    .from('issues')
    .select('id, issue_number, slug, title, publication_date, status, page_count, price_per_page, full_download_price')
    .order('created_at', { ascending: false });

  const statusColors: Record<string, string> = {
    draft: 'bg-neutral-100 text-neutral-600',
    ready: 'bg-blue-100 text-blue-700',
    scheduled: 'bg-amber-100 text-amber-700',
    published: 'bg-green-100 text-green-700',
    archived: 'bg-neutral-200 text-neutral-500',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Brouillon',
    ready: 'Prêt',
    scheduled: 'Programmé',
    published: 'Publié',
    archived: 'Archivé',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-neutral-800">Cahiers</h2>
          <p className="mt-1 text-sm text-neutral-500">Gérez les Cahiers et leurs pages.</p>
        </div>
        <Link
          href="/admin/cahiers/new"
          className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90"
        >
          <Plus className="h-4 w-4" />
          Nouveau Cahier
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">N°</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Titre</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Statut</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Pages</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Prix/page</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Prix complet</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(!issues || issues.length === 0) && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <BookOpen className="mx-auto h-8 w-8 text-neutral-300" strokeWidth={1.5} />
                  <p className="mt-2 text-sm text-neutral-400">Aucun Cahier pour le moment.</p>
                  <Link href="/admin/cahiers/new" className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-ink hover:underline">
                    <Plus className="h-3.5 w-3.5" /> Créer un Cahier
                  </Link>
                </td>
              </tr>
            )}
            {issues?.map((issue) => (
              <tr key={issue.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 text-sm font-bold text-neutral-800">N°{issue.issue_number}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/cahiers/${issue.id}/edit`} className="text-sm font-medium text-neutral-800 hover:text-ink">
                    {issue.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-500">
                  {issue.publication_date ? new Date(issue.publication_date).toLocaleDateString('fr-FR') : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[issue.status] ?? ''}`}>
                    {statusLabels[issue.status] ?? issue.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-500">{issue.page_count}</td>
                <td className="px-4 py-3 text-sm text-neutral-500">{issue.price_per_page} €</td>
                <td className="px-4 py-3 text-sm text-neutral-500">{issue.full_download_price} €</td>
                <td className="px-4 py-3">
                  <IssueActions
                    issueId={issue.id}
                    status={issue.status}
                    title={issue.title}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
