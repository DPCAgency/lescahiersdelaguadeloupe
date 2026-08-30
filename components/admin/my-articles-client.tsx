'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, FileText, Search } from 'lucide-react';
import ArticleActions from '@/components/admin/article-actions';

export interface MyArticleRow {
  id: string;
  title: string;
  slug: string;
  format: string;
  status: string;
  featured: boolean;
  published_at: string | null;
  updated_at: string;
  category_id: string | null;
  author_id: string | null;
  categories?: { slug: string; name: string }[];
  authors?: { slug: string; name: string }[];
}

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
  review: 'En validation',
  changes_requested: 'Corrections demandées',
  ready: 'Validé',
  scheduled: 'Programmé',
  published: 'Publié',
  archived: 'Archivé',
};

const formatOptions = [
  { value: '', label: 'Tous les formats' },
  { value: 'enquete', label: 'Enquête' },
  { value: 'analyse', label: 'Analyse' },
  { value: 'decryptage', label: 'Décryptage' },
  { value: 'entretien', label: 'Entretien' },
  { value: 'chronologie', label: 'Chronologie' },
  { value: 'tribune', label: 'Tribune' },
  { value: 'reportage', label: 'Reportage' },
  { value: 'dossier', label: 'Dossier' },
];

export function MyArticlesClient({ articles }: { articles: Record<string, unknown>[] }) {
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFormat, setFilterFormat] = useState('');
  const [search, setSearch] = useState('');

  const rows = articles as unknown as MyArticleRow[];

  const filtered = useMemo(() => {
    return rows.filter((a) => {
      if (filterStatus && a.status !== filterStatus) return false;
      if (filterFormat && a.format !== filterFormat) return false;
      if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [rows, filterStatus, filterFormat, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-neutral-800">Mes articles</h2>
          <p className="mt-1 text-sm text-neutral-500">Vos contenus personnels.</p>
        </div>
        <Link href="/admin/articles/new" className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90">
          <Plus className="h-4 w-4" /> Nouvel article
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600">
          <option value="">Tous les statuts</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select value={filterFormat} onChange={(e) => setFilterFormat(e.target.value)} className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600">
          {formatOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par titre…" className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-10 pr-3 text-sm" />
        </div>
      </div>

      <p className="text-xs text-neutral-400">{filtered.length} article(s)</p>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-lg border border-neutral-200 bg-white md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Titre</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Format</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Statut</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Modifié</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center">
                <FileText className="mx-auto h-8 w-8 text-neutral-300" strokeWidth={1.5} />
                <p className="mt-2 text-sm text-neutral-400">Aucun article.</p>
              </td></tr>
            )}
            {filtered.map((article) => (
              <tr key={article.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/articles/${article.id}`} className="text-sm font-medium text-neutral-800 hover:text-ink">{article.title}</Link>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-500">{article.format}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[article.status] ?? ''}`}>{statusLabels[article.status] ?? article.status}</span>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-400">{new Date(article.updated_at).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3">
                  <ArticleActions articleId={article.id} status={article.status} title={article.title} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 && (
          <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
            <FileText className="mx-auto h-8 w-8 text-neutral-300" strokeWidth={1.5} />
            <p className="mt-2 text-sm text-neutral-400">Aucun article.</p>
          </div>
        )}
        {filtered.map((article) => (
          <div key={article.id} className="rounded-lg border border-neutral-200 bg-white p-4">
            <Link href={`/admin/articles/${article.id}`} className="text-sm font-medium text-neutral-800 hover:text-ink">{article.title}</Link>
            <div className="mt-2 flex items-center justify-between">
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[article.status] ?? ''}`}>{statusLabels[article.status] ?? article.status}</span>
              <span className="text-xs text-neutral-400">{new Date(article.updated_at).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="mt-3">
              <ArticleActions articleId={article.id} status={article.status} title={article.title} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
