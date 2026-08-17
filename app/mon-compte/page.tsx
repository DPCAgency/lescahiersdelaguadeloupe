import Link from 'next/link';
import { BookOpen, FileText, Heart, CreditCard, User } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Mon compte',
  description: 'Votre espace lecteur des Cahiers de la Guadeloupe.',
};

const NAV = [
  { label: 'Bibliothèque', href: '/mon-compte/bibliotheque', icon: BookOpen },
  { label: 'Achats', href: '/mon-compte/achats', icon: CreditCard },
  { label: 'Pages débloquées', href: '/mon-compte/pages-debloquees', icon: FileText },
  { label: 'Favoris', href: '/mon-compte/favoris', icon: Heart },
  { label: 'Profil', href: '/mon-compte/profil', icon: User },
];

export default function Page() {
  return (
    <section className="border-b border-border">
      <div className="container-editorial py-12 lg:py-16">
        <p className="eyebrow">Espace lecteur</p>
        <h1 className="display-title mt-3 text-[32px] leading-[0.98] sm:text-[44px]">
          Mon compte
        </h1>
        <p className="mt-3 text-[15px] text-text">
          Retrouvez vos Cahiers, vos achats et votre abonnement.
        </p>

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
          <p className="eyebrow-muted mb-4">Démonstration</p>
          <p className="text-[14px] text-muted">
            Les pages du compte lecteur sont préparées pour l'authentification Supabase. Elles
            permettront de retrouver les Cahiers achetés et les pages débloquées.
          </p>
        </div>
      </div>
    </section>
  );
}
