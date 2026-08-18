import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { BookOpen, Heart, User, LogOut, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Mon compte',
  description: 'Votre espace lecteur des Cahiers de la Guadeloupe.',
};

export default async function MonComptePage() {
  const token = cookies().get('sb-access-token')?.value;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let displayName = '';
  let role = '';

  const { data: userData } = await client.auth.getUser(token);
  if (userData?.user?.id) {
    const { data: profile } = await client
      .from('profiles')
      .select('display_name, role')
      .eq('id', userData.user.id)
      .maybeSingle();

    displayName = profile?.display_name || userData.user.email || '';
    role = profile?.role || 'reader';
  }

  const isAdmin = ['editor', 'admin', 'super_admin'].includes(role);

  const NAV = [
    { label: 'Bibliothèque', href: '/mon-compte/bibliotheque', icon: BookOpen },
    { label: 'Favoris', href: '/mon-compte/favoris', icon: Heart },
    { label: 'Profil', href: '/mon-compte/profil', icon: User },
  ];

  return (
    <section className="border-b border-border">
      <div className="container-editorial py-12 lg:py-16">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow">Espace lecteur</p>
            <h1 className="display-title mt-3 text-[32px] leading-[0.98] sm:text-[44px]">
              Mon compte
            </h1>
            <p className="mt-3 text-[15px] text-text">
              {displayName ? `Bonjour, ${displayName}` : 'Bienvenue dans votre espace lecteur.'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            {isAdmin && (
              <Link href="/admin/dashboard" className="text-[13px] font-medium text-primary hover:text-primary-dark">
                Accéder à l'administration →
              </Link>
            )}
            <form action="/api/auth/signout" method="post">
              <button type="submit" className="flex items-center gap-2 text-[13px] text-muted hover:text-ink">
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </button>
            </form>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-4 bg-background p-6 transition-colors hover:bg-background-soft"
              >
                <span className="flex h-12 w-12 items-center justify-center border border-ink text-ink transition-colors group-hover:border-primary group-hover:text-primary">
                  <Icon className="h-6 w-6" strokeWidth={1.5} />
                </span>
                <span className="article-title text-[18px]">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 border-t border-border pt-8">
          <p className="eyebrow-muted mb-4">Accès gratuit</p>
          <p className="text-[14px] text-muted">
            Les Cahiers de la Guadeloupe sont actuellement accessibles gratuitement. Les achats et l'abonnement seront proposés prochainement.
          </p>
          <Link href="/les-cahiers" className="btn-editorial-outline mt-4 inline-flex">
            <FileText className="h-4 w-4" />
            Consulter les Cahiers
          </Link>
        </div>
      </div>
    </section>
  );
}
