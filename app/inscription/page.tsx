import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Créer un compte',
  description: 'Créez votre espace lecteur des Cahiers de la Guadeloupe.',
};

export default function Page() {
  return (
    <section className="flex min-h-[70vh] items-center">
      <div className="container-narrow py-16">
        <div className="border border-border bg-background p-8 sm:p-12">
          <p className="eyebrow">Espace lecteur</p>
          <h1 className="display-title mt-3 text-[32px] leading-[0.98] sm:text-[40px]">
            Créer votre espace lecteur
          </h1>
          <p className="mt-3 text-[15px] text-text">
            Inscrivez-vous pour accéder à vos achats, vos favoris et votre bibliothèque.
          </p>

          <form className="mt-8 flex flex-col gap-5" action="/api/auth/signup" method="post">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="firstname" className="eyebrow-muted">Prénom</label>
                <input id="firstname" name="firstname" type="text" required className="border border-border bg-transparent px-4 py-3 text-[15px] text-ink outline-none focus:border-primary" />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="lastname" className="eyebrow-muted">Nom</label>
                <input id="lastname" name="lastname" type="text" required className="border border-border bg-transparent px-4 py-3 text-[15px] text-ink outline-none focus:border-primary" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="eyebrow-muted">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" className="border border-border bg-transparent px-4 py-3 text-[15px] text-ink outline-none focus:border-primary" placeholder="votre@email.fr" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="eyebrow-muted">Mot de passe</label>
              <input id="password" name="password" type="password" required autoComplete="new-password" className="border border-border bg-transparent px-4 py-3 text-[15px] text-ink outline-none focus:border-primary" placeholder="••••••••" />
            </div>
            <label className="flex items-start gap-3 text-[13px] text-muted">
              <input type="checkbox" name="terms" required className="mt-1 h-4 w-4 border-border accent-primary" />
              <span>J'accepte les <Link href="/mentions-legales" className="text-primary hover:text-primary-dark">conditions d'utilisation</Link> et la <Link href="/politique-confidentialite" className="text-primary hover:text-primary-dark">politique de confidentialité</Link>.</span>
            </label>
            <label className="flex items-start gap-3 text-[13px] text-muted">
              <input type="checkbox" name="newsletter" className="mt-1 h-4 w-4 border-border accent-primary" />
              <span>Je souhaite recevoir la lettre des Cahiers de la Guadeloupe (optionnel, séparé du compte).</span>
            </label>
            <button type="submit" className="btn-editorial w-full">
              Créer mon compte
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 border-t border-border pt-6">
            <p className="text-[14px] text-muted">
              Déjà inscrit ?{' '}
              <Link href="/connexion" className="font-semibold text-primary hover:text-primary-dark">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
