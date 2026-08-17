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

          <form className="mt-8 flex flex-col gap-5" action="/api/auth/signin" method="post">
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
          </form>

          <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6">
            <Link href="/inscription" className="text-[14px] font-medium text-primary hover:text-primary-dark">
              Créer un compte
            </Link>
            <Link href="/mot-de-passe-oublie" className="text-[14px] text-muted hover:text-ink">
              Mot de passe oublié ?
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-[12px] text-muted">
          Pas encore abonné ?{' '}
          <Link href="/abonnement" className="font-semibold text-primary hover:text-primary-dark">
            Découvrir nos formules
          </Link>
        </p>
      </div>
    </section>
  );
}
