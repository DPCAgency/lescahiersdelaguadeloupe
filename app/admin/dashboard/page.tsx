import Link from 'next/link';
import { cookies } from 'next/headers';
import { FileText, BookOpen, Users, ShoppingCart, ArrowRight, TrendingUp, Plus, CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

interface DashboardUser {
  id: string;
  role: string;
  author_id: string | null;
  display_name: string | null;
}

async function getDashboardUser(): Promise<DashboardUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('sb-access-token')?.value;
  if (!token) return null;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  try {
    const client = createClient(supabaseUrl, anonKey);
    const { data: userData } = await client.auth.getUser(token);
    if (!userData?.user?.id) return null;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile } = await userClient
      .from('profiles')
      .select('role, author_id, display_name')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (!profile) return null;
    return {
      id: userData.user.id,
      role: profile.role,
      author_id: profile.author_id,
      display_name: profile.display_name,
    };
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const user = await getDashboardUser();
  const role = user?.role ?? 'admin';
  const isAuthor = role === 'author';
  const isEditor = role === 'editor';
  const isAdmin = role === 'admin' || role === 'super_admin';

  const greeting = user?.display_name
    ? `Bonjour ${user.display_name}`
    : 'Bonjour';

  if (isAuthor) {
    // Author dashboard
    const [
      { count: drafts },
      { count: changesRequested },
      { count: inReview },
      { count: scheduled },
      { count: published },
      { data: myArticles },
      { data: myIssues },
    ] = await Promise.all([
      supabaseAdmin.from('articles').select('*', { count: 'exact', head: true }).eq('created_by', user!.id).eq('status', 'draft'),
      supabaseAdmin.from('articles').select('*', { count: 'exact', head: true }).eq('created_by', user!.id).eq('status', 'changes_requested'),
      supabaseAdmin.from('articles').select('*', { count: 'exact', head: true }).eq('created_by', user!.id).eq('status', 'review'),
      supabaseAdmin.from('articles').select('*', { count: 'exact', head: true }).eq('created_by', user!.id).eq('status', 'scheduled'),
      supabaseAdmin.from('articles').select('*', { count: 'exact', head: true }).eq('created_by', user!.id).eq('status', 'published'),
      supabaseAdmin.from('articles').select('id, title, status, updated_at').eq('created_by', user!.id).order('updated_at', { ascending: false }).limit(10),
      supabaseAdmin.from('issues').select('id, issue_number, title, status, updated_at, issue_collaborators!inner(role)').eq('issue_collaborators.profile_id', user!.id).order('updated_at', { ascending: false }).limit(5),
    ]);

    const cards = [
      { label: 'Brouillons', value: drafts ?? 0, icon: FileText, color: 'text-neutral-500' },
      { label: 'Corrections demandées', value: changesRequested ?? 0, icon: AlertCircle, color: 'text-amber-600' },
      { label: 'En attente de validation', value: inReview ?? 0, icon: Clock, color: 'text-blue-600' },
      { label: 'Programmés', value: scheduled ?? 0, icon: Calendar, color: 'text-blue-600' },
      { label: 'Publiés', value: published ?? 0, icon: CheckCircle, color: 'text-green-600' },
    ];

    const statusLabels: Record<string, string> = {
      draft: 'Brouillon', review: 'En validation', changes_requested: 'Corrections',
      ready: 'Validé', scheduled: 'Programmé', published: 'Publié', archived: 'Archivé',
    };
    const statusColors: Record<string, string> = {
      draft: 'bg-neutral-100 text-neutral-600', review: 'bg-amber-100 text-amber-700',
      changes_requested: 'bg-red-100 text-red-700', ready: 'bg-blue-100 text-blue-700',
      scheduled: 'bg-blue-100 text-blue-700', published: 'bg-green-100 text-green-700',
      archived: 'bg-neutral-200 text-neutral-500',
    };

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-400">{greeting}</p>
            <h2 className="font-display text-2xl font-bold text-neutral-800">Espace Auteur</h2>
            <p className="mt-1 text-sm text-neutral-500">Les Cahiers de la Guadeloupe</p>
          </div>
          <Link href="/admin/articles/new" className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90">
            <Plus className="h-4 w-4" /> Nouvel article
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-lg border border-neutral-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">{card.label}</span>
                  <Icon className={`h-4 w-4 ${card.color}`} strokeWidth={1.5} />
                </div>
                <p className="mt-3 font-display text-2xl font-bold text-neutral-800">{card.value}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-neutral-600">Mes derniers articles</h3>
          <div className="mt-4 space-y-3">
            {(myArticles ?? []).length === 0 && (
              <p className="text-sm text-neutral-400">Aucun article pour le moment.</p>
            )}
            {(myArticles ?? []).map((article) => (
              <div key={article.id} className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0">
                <div>
                  <Link href={`/admin/articles/${article.id}`} className="text-sm font-medium text-neutral-800 hover:text-ink">
                    {article.title}
                  </Link>
                  <p className="text-xs text-neutral-400">{new Date(article.updated_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[article.status] ?? ''}`}>
                  {statusLabels[article.status] ?? article.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-neutral-600">Mes Cahiers</h3>
            <Link href="/admin/mes-cahiers" className="flex items-center gap-1 text-xs font-medium text-ink hover:underline">
              Voir tout <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {(myIssues ?? []).length === 0 && (
              <p className="text-sm text-neutral-400">Aucun Cahier ne vous est assigné pour le moment.</p>
            )}
            {(myIssues ?? []).map((issue) => (
              <div key={issue.id} className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0">
                <div>
                  <Link href={`/admin/cahiers/${issue.id}/edit`} className="text-sm font-medium text-neutral-800 hover:text-ink">
                    N°{issue.issue_number} · {issue.title}
                  </Link>
                  <p className="text-xs text-neutral-400">{new Date(issue.updated_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[issue.status] ?? ''}`}>
                  {statusLabels[issue.status] ?? issue.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <Link href="/admin/aide" className="flex items-center gap-2 text-sm text-neutral-500 hover:text-ink">
            <ArrowRight className="h-4 w-4" /> Besoin d'aide ? Consultez le guide de rédaction et de publication.
          </Link>
        </div>
      </div>
    );
  }

  // Editor / Admin dashboard
  const [
    { count: publishedArticles },
    { count: draftArticles },
    { count: reviewArticles },
    { count: changesArticles },
    { count: readyArticles },
    { count: scheduledArticles },
    { count: publishedIssues },
    { count: draftIssues },
    { count: readers },
    { count: orders },
    { data: recentArticles },
    { data: recentIssues },
    { data: reviewList },
  ] = await Promise.all([
    supabaseAdmin.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabaseAdmin.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabaseAdmin.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'review'),
    supabaseAdmin.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'changes_requested'),
    supabaseAdmin.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'ready'),
    supabaseAdmin.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
    supabaseAdmin.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabaseAdmin.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'reader'),
    supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('articles').select('id, title, slug, updated_at, status').order('updated_at', { ascending: false }).limit(5),
    supabaseAdmin.from('issues').select('id, issue_number, title, created_at, status').order('created_at', { ascending: false }).limit(5),
    supabaseAdmin.from('articles').select('id, title, status, submitted_at, updated_at, authors(name), categories(name)').eq('status', 'review').order('submitted_at', { ascending: false }).limit(10),
  ]);

  if (isEditor) {
    const cards = [
      { label: 'À valider', value: reviewArticles ?? 0, icon: Clock, color: 'text-amber-600' },
      { label: 'Corrections en cours', value: changesArticles ?? 0, icon: AlertCircle, color: 'text-red-500' },
      { label: 'Validés', value: readyArticles ?? 0, icon: CheckCircle, color: 'text-blue-600' },
      { label: 'Programmés', value: scheduledArticles ?? 0, icon: Calendar, color: 'text-blue-600' },
      { label: 'Publiés', value: publishedArticles ?? 0, icon: CheckCircle, color: 'text-green-600' },
      { label: 'Cahiers publiés', value: publishedIssues ?? 0, icon: BookOpen, color: 'text-green-600' },
      { label: 'Cahiers brouillons', value: draftIssues ?? 0, icon: BookOpen, color: 'text-neutral-500' },
    ];

    const statusLabels: Record<string, string> = {
      draft: 'Brouillon', review: 'En validation', changes_requested: 'Corrections',
      ready: 'Validé', scheduled: 'Programmé', published: 'Publié', archived: 'Archivé',
    };
    const statusColors: Record<string, string> = {
      draft: 'bg-neutral-100 text-neutral-600', review: 'bg-amber-100 text-amber-700',
      changes_requested: 'bg-red-100 text-red-700', ready: 'bg-blue-100 text-blue-700',
      scheduled: 'bg-blue-100 text-blue-700', published: 'bg-green-100 text-green-700',
      archived: 'bg-neutral-200 text-neutral-500',
    };

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-neutral-800">Tableau de bord rédaction</h2>
            <p className="mt-1 text-sm text-neutral-500">Vue d'ensemble éditoriale.</p>
          </div>
          <Link href="/admin/articles/new" className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90">
            <Plus className="h-4 w-4" /> Nouvel article
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-7">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-lg border border-neutral-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">{card.label}</span>
                  <Icon className={`h-4 w-4 ${card.color}`} strokeWidth={1.5} />
                </div>
                <p className="mt-3 font-display text-2xl font-bold text-neutral-800">{card.value}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-neutral-600">Derniers Cahiers</h3>
            <Link href="/admin/cahiers" className="flex items-center gap-1 text-xs font-medium text-ink hover:underline">
              Voir tout <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {(recentIssues ?? []).length === 0 && (
              <li className="text-sm text-neutral-400">Aucun Cahier pour le moment.</li>
            )}
            {(recentIssues ?? []).map((issue) => (
              <li key={issue.id} className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0">
                <div>
                  <Link href={`/admin/cahiers/${issue.id}/edit`} className="text-sm font-medium text-neutral-800 hover:text-ink">
                    N°{issue.issue_number} · {issue.title}
                  </Link>
                  <p className="text-xs text-neutral-400">{new Date(issue.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <Link href={`/admin/cahiers/${issue.id}/edit`} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50">Ouvrir Studio</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-neutral-600">Articles à relire</h3>
          <div className="mt-4 space-y-3">
            {(reviewList ?? []).length === 0 && (
              <p className="text-sm text-neutral-400">Aucun article en attente de validation.</p>
            )}
            {(reviewList ?? []).map((article) => {
              const a = article as Record<string, unknown>;
              const authorName = (a.authors as { name: string }[] | null)?.[0]?.name ?? '·';
              const categoryName = (a.categories as { name: string }[] | null)?.[0]?.name ?? '·';
              const submittedAt = a.submitted_at ? new Date(a.submitted_at as string).toLocaleDateString('fr-FR') : '·';
              return (
                <div key={a.id as string} className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0">
                  <div>
                    <Link href={`/admin/articles/${a.id as string}`} className="text-sm font-medium text-neutral-800 hover:text-ink">
                      {a.title as string}
                    </Link>
                    <p className="text-xs text-neutral-400">{authorName} · {categoryName} · Soumis le {submittedAt}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/articles/${a.id as string}`} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50">Lire</Link>
                    <Link href={`/admin/articles/${a.id as string}`} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50">Modifier</Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Admin / Super Admin dashboard
  const cards = [
    { label: 'Articles publiés', value: publishedArticles ?? 0, icon: FileText, color: 'text-green-600' },
    { label: 'Articles brouillons', value: draftArticles ?? 0, icon: FileText, color: 'text-neutral-500' },
    { label: 'À valider', value: reviewArticles ?? 0, icon: Clock, color: 'text-amber-600' },
    { label: 'Corrections', value: changesArticles ?? 0, icon: AlertCircle, color: 'text-red-500' },
    { label: 'Cahiers publiés', value: publishedIssues ?? 0, icon: BookOpen, color: 'text-green-600' },
    { label: 'Cahiers brouillons', value: draftIssues ?? 0, icon: BookOpen, color: 'text-neutral-500' },
    { label: 'Lecteurs', value: readers ?? 0, icon: Users, color: 'text-blue-600' },
    { label: 'Commandes', value: orders ?? 0, icon: ShoppingCart, color: 'text-neutral-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-neutral-800">Tableau de bord</h2>
        <p className="mt-1 text-sm text-neutral-500">Vue d'ensemble du média.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-neutral-600">Derniers articles modifiés</h3>
            <Link href="/admin/articles" className="flex items-center gap-1 text-xs font-medium text-ink hover:underline">
              Voir tout <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {(recentArticles ?? []).length === 0 && (
              <li className="text-sm text-neutral-400">Aucun article pour le moment.</li>
            )}
            {(recentArticles ?? []).map((article) => (
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
            {(recentIssues ?? []).length === 0 && (
              <li className="text-sm text-neutral-400">Aucun Cahier pour le moment.</li>
            )}
            {(recentIssues ?? []).map((issue) => (
              <li key={issue.id} className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0">
                <div>
                  <Link href={`/admin/cahiers/${issue.id}`} className="text-sm font-medium text-neutral-800 hover:text-ink">
                    N°{issue.issue_number} · {issue.title}
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

      <div className="rounded-lg border border-neutral-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-neutral-600">Activité rédactionnelle</h3>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div>
            <p className="text-xs text-neutral-400">Brouillons</p>
            <p className="font-display text-xl font-bold text-neutral-700">{draftArticles ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">À valider</p>
            <p className="font-display text-xl font-bold text-amber-600">{reviewArticles ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Corrections</p>
            <p className="font-display text-xl font-bold text-red-500">{changesArticles ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Publiés</p>
            <p className="font-display text-xl font-bold text-green-600">{publishedArticles ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-neutral-600">Commerce</h3>
        </div>
        <p className="mt-3 text-sm text-neutral-400">
          {orders ?? 0} commande(s) enregistrée(s). Le paiement n'est pas encore activé · les données s'afficheront ici une fois Stripe connecté.
        </p>
      </div>
    </div>
  );
}
