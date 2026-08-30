import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const RUBRICS = [
  { label: 'Politique & Institutions', href: '/politique-institutions' },
  { label: 'Économie', href: '/economie' },
  { label: 'Société', href: '/societe' },
  { label: 'Territoires', href: '/territoires' },
  { label: 'Environnement', href: '/environnement' },
  { label: 'Culture', href: '/culture' },
  { label: 'Enquêtes', href: '/enquetes' },
  { label: 'Les Cahiers', href: '/les-cahiers' },
];

const SECONDARY = [
  { label: 'Archives', href: '/archives' },
  { label: 'Sujets', href: '/sujets' },
  { label: 'Communes', href: '/communes' },
  { label: 'La rédaction', href: '/redaction' },
  { label: 'Notre méthode', href: '/notre-methode' },
  { label: 'Droit de réponse', href: '/droit-de-reponse' },
  { label: 'Contact', href: '/contact' },
];

const LEGAL = [
  { label: 'Mentions légales', href: '/mentions-legales' },
  { label: 'Politique de confidentialité', href: '/politique-confidentialite' },
  { label: 'Cookies', href: '/cookies' },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-ink bg-background">
      <div className="container-editorial py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* Logo + newsletter */}
          <div className="md:col-span-5">
            <Link href="/" className="block">
              <span className="font-serif text-[22px] font-bold text-ink">
                Les Cahiers de la Guadeloupe
              </span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.28em] text-muted">
                Revue d’analyse et d’investigation
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-text">
              Comprendre aujourd’hui pour agir demain. Une revue indépendante qui enquête, documente et éclaire le débat public en Guadeloupe.
            </p>
            <form className="mt-6 max-w-sm" action="/api/newsletter" method="post">
              <label htmlFor="footer-email" className="eyebrow-muted mb-2 block">
                La lettre · mensuelle, gratuite
              </label>
              <div className="flex items-center border border-ink">
                <input
                  id="footer-email"
                  type="email"
                  name="email"
                  required
                  placeholder="Votre email"
                  className="w-full bg-transparent px-3 py-2.5 text-[14px] text-ink outline-none placeholder:text-muted"
                />
                <button
                  type="submit"
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center bg-ink text-white transition-colors hover:bg-primary"
                  aria-label="S’inscrire"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                En vous inscrivant, vous acceptez notre politique de confidentialité.
              </p>
            </form>
          </div>

          {/* Rubriques */}
          <div className="md:col-span-4">
            <p className="eyebrow-ink mb-4">Rubriques</p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {RUBRICS.map((r) => (
                <li key={r.href}>
                  <Link href={r.href} className="link-underline text-[14px] font-medium">
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation secondaire + légal */}
          <div className="md:col-span-3">
            <p className="eyebrow-ink mb-4">Le média</p>
            <ul className="flex flex-col gap-2.5">
              {SECONDARY.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className="link-underline text-[14px] font-medium text-text">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="eyebrow-ink mt-6 mb-4">Informations</p>
            <ul className="flex flex-col gap-2.5">
              {LEGAL.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="link-underline text-[14px] font-medium text-text">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-[12px] text-muted">
            © {new Date().getFullYear()} Les Cahiers de la Guadeloupe · Tous droits réservés
          </p>
          <p className="text-[12px] text-muted">
            N°2 · Août 2026 · Comprendre aujourd’hui pour agir demain
          </p>
        </div>
      </div>

      {/* Bandeau signature méthodologique */}
      <div className="border-t border-border bg-ink">
        <div className="container-editorial py-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/85 sm:text-[13px]">
            Enquêter • Comprendre • Éclairer • Débattre
          </p>
        </div>
      </div>
    </footer>
  );
}
