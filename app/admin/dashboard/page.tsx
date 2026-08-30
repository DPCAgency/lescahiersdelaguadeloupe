import Link from 'next/link';
import { FileText, BookOpen, Users, ShoppingCart, ArrowRight, TrendingUp } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function getDashboardStats() {
  const [
    { count: publishedArticles },
    { count: draftArticles },
    { count: publishedIssues },
    { count: draftIssues },
    { count: readers },
    { count: orders },
    { data: recentArticles },
    { data: recentIssues },
  ] = await Promise.all([
    supabaseAdmin.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabaseAdmin.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabaseAdmin.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabaseAdmin.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'reader'),
    supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('articles').select('id, title, slug, updated_at, status').order('updated_at', { ascending: false }).limit(5),
    supabaseAdmin.from('issues').select('id, issue_number, title, created_at, status').order('created_at', { ascending: false }).limit(5),
  ]);

  return {
    publishedArticles: publishedArticles ?? 0,
    draftArticles: draftArticles ?? 0,
    publishedIssues: publishedIssues ?? 0,
    draftIssues: draftIssues ?? 0,
    readers: readers ?? 0,
    orders: orders ?? 0,
    recentArticles: recentArticles ?? [],
    recentIssues: recentIssues ?? [],
  };
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    { label: 'Articles publiés', value: stats.publishedArticles, icon: FileText, color: 'text-green-600' },
    { label: 'Articles brouillons', value: stats.draftArticles, icon: FileText, color: 'text-neutral-500' },
    { label: 'Cahiers publiés', value: stats.publishedIssues, icon: BookOpen, color: 'text-green-600' },
    { label: 'Cahiers brouillons', value: stats.draftIssues, icon: BookOpen, color: 'text-neutral-500' },
    { label: 'Lecteurs', value: stats.readers, icon: Users, color: 'text-blue-600' },
    { label: 'Commandes', value: stats.orders, icon: ShoppingCart, color: 'text-neutral-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-neutral-800">Tableau de bord</h2>
        <p className="mt-1 text-sm text-neutral-500">Vue d'ensemble du média.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-lg border border-neutral-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">{card.label}</span>
                <Icon className={`h-5 w-5 ${card.color}`} strokeWidth={1.5} />
              </div>
              <p className="mt-3 font-display text-3xl font-bold text-neutral-800">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-neutral-600">Derniers articles modifiés</h3>
            <Link href="/admin/articles" className="flex items-center gap-1 text-xs font-medium text-ink hover:underline">
              Voir tout <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {stats.recentArticles.length === 0 && (
              <li className="text-sm text-neutral-400">Aucun article pour le moment.</li>
            )}
            {stats.recentArticles.map((article) => (
              <li key={article.id} className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0">
                <div>
                  <Link href={`/admin/articles/${article.id}`} className="text-sm font-medium text-neutral-800 hover:text-ink">
                    {article.title}
                  </Link>
                  <p className="text-xs text-neutral-400">
                    {article.status === 'published' ? 'Publié' : 'Brouillon'} · {new Date(article.updated_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-neutral-600">Derniers Cahiers ajoutés</h3>
            <Link href="/admin/cahiers" className="flex items-center gap-1 text-xs font-medium text-ink hover:underline">
              Voir tout <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {stats.recentIssues.length === 0 && (
              <li className="text-sm text-neutral-400">Aucun Cahier pour le moment.</li>
            )}
            {stats.recentIssues.map((issue) => (
              <li key={issue.id} className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0">
                <div>
                  <Link href={`/admin/cahiers/${issue.id}`} className="text-sm font-medium text-neutral-800 hover:text-ink">
                    N°{issue.issue_number} — {issue.title}
                  </Link>
                  <p className="text-xs text-neutral-400">
                    {issue.status === 'published' ? 'Publié' : 'Brouillon'} · {new Date(issue.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Commerce placeholder */}
      <div className="rounded-lg border border-neutral-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-neutral-600">Commerce</h3>
        </div>
        <p className="mt-3 text-sm text-neutral-400">
          {stats.orders} commande(s) enregistrée(s). Le paiement n'est pas encore activé — les données s'afficheront ici une fois Stripe connecté.
        </p>
      </div>
    </div>
  );
}
