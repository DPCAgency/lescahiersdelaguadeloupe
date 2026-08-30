import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Connexion',
  description: 'Accédez à vos Cahiers.',
};

export default async function Page({ searchParams }: { searchParams: { redirect?: string } }) {
  const redirect = searchParams.redirect || '';
  return (
    <section className="flex min-h-[70vh] items-center">
      <div className="container-narrow py-16">
        <div className="border border-border bg-background p-8 sm:p-12">
          <p className="eyebrow">Espace lecteur</p>
          <h1 className="display-title mt-3 text-[32px] leading-[0.98] sm:text-[40px]">
            Accéder à vos Cahiers
          </h1>

          <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">
            Déjà un compte ?
          </p>

          <form className="mt-4 flex flex-col gap-5" action="/api/auth/signin" method="post">
            {redirect && (
              <input type="hidden" name="redirect" value={redirect} />
            )}
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="eyebrow-muted">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="border border-border bg-transparent px-4 py-3 text-[15px] text-ink outline-none focus:border-primary"
                placeholder="votre@email.fr"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="eyebrow-muted">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="border border-border bg-transparent px-4 py-3 text-[15px] text-ink outline-none focus:border-primary"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn-editorial w-full">
              Se connecter
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link href="/mot-de-passe-oublie" className="text-center text-[13px] text-muted hover:text-ink">
              Mot de passe oublié ?
            </Link>
          </form>

          <div className="mt-8 border-t border-border pt-6">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">
              Nouveau lecteur ?
            </p>
            <p className="mt-2 text-[14px] text-muted">
              Créez gratuitement votre compte pour accéder à votre bibliothèque et vos favoris.
            </p>
            <Link href="/inscription" className="btn-editorial-outline mt-4 inline-flex">
              Créer gratuitement mon compte
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
