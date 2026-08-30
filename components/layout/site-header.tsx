'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, Search, X, ChevronRight, User } from 'lucide-react';

const NAV = [
  { label: 'Accueil', href: '/' },
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

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen || searchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen, searchOpen]);

  return (
    <>
      {/* Bandeau éditorial · signature méthodologique */}
      <div className="hidden border-b border-border bg-ink text-white md:block">
        <div className="container-editorial flex items-center justify-center py-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/80">
            Enquêter • Comprendre • Éclairer • Débattre
          </p>
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 border-b bg-background transition-colors ${
          scrolled ? 'border-ink/10 shadow-[0_1px_0_0_rgba(0,0,0,0.04)]' : 'border-border'
        }`}
      >
        <div className="container-editorial">
          {/* Ligne principale */}
          <div className="flex items-center justify-between gap-4 py-3">
            {/* Logo */}
            <Link href="/" className="group flex flex-col leading-none" aria-label="Accueil · Les Cahiers de la Guadeloupe">
              <span className="font-serif text-[19px] font-bold tracking-[-0.01em] text-ink sm:text-[22px]">
                Les Cahiers de la Guadeloupe
              </span>
              <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.28em] text-muted sm:text-[10px]">
                Revue d’analyse et d’investigation
              </span>
            </Link>

            {/* Actions desktop */}
            <div className="hidden items-center gap-2 md:flex">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex h-9 w-9 items-center justify-center text-ink transition-colors hover:text-primary"
                aria-label="Rechercher"
              >
                <Search className="h-[18px] w-[18px]" />
              </button>
              <Link
                href="/mon-compte"
                className="flex h-9 items-center gap-1.5 px-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:text-primary"
                aria-label="Mon espace"
              >
                <User className="h-[16px] w-[16px]" />
                <span className="hidden lg:inline">Mon espace</span>
              </Link>
              <Link
                href="/les-cahiers"
                className="btn-editorial px-4 py-2 text-[11px]"
              >
                Les Cahiers
              </Link>
            </div>

            {/* Actions mobile */}
            <div className="flex items-center gap-1 md:hidden">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex h-9 w-9 items-center justify-center text-ink"
                aria-label="Rechercher"
              >
                <Search className="h-5 w-5" />
              </button>
              <Link
                href="/mon-compte"
                className="flex h-9 w-9 items-center justify-center text-ink"
                aria-label="Mon espace"
              >
                <User className="h-5 w-5" />
              </Link>
              <button
                onClick={() => setMenuOpen(true)}
                className="flex h-9 w-9 items-center justify-center text-ink"
                aria-label="Ouvrir le menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation desktop */}
          <nav className="hidden border-t border-border md:block" aria-label="Navigation principale">
            <ul className="flex items-center gap-5 py-2.5">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="link-underline text-[12px] font-semibold uppercase tracking-[0.12em] text-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      {/* Menu mobile plein écran */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-background md:hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <span className="font-serif text-[17px] font-bold text-ink">Les Cahiers de la Guadeloupe</span>
            <button
              onClick={() => setMenuOpen(false)}
              className="flex h-9 w-9 items-center justify-center text-ink"
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex h-[calc(100vh-57px)] flex-col overflow-y-auto px-5 py-6">
            <p className="eyebrow-muted mb-4">Rubriques</p>
            <nav className="flex flex-col" aria-label="Navigation mobile">
              {NAV.filter((n) => n.href !== '/').map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between border-b border-border py-3.5"
                >
                  <span className="article-title text-[22px]">{item.label}</span>
                  <ChevronRight className="h-5 w-5 text-muted" />
                </Link>
              ))}
            </nav>
            <p className="eyebrow-muted mt-8 mb-4">Le média</p>
            <nav className="flex flex-col" aria-label="Navigation secondaire mobile">
              {SECONDARY.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between py-3 text-[15px] font-medium text-text"
                >
                  {s.label}
                  <ChevronRight className="h-4 w-4 text-muted" />
                </Link>
              ))}
            </nav>
            <div className="mt-auto pt-8">
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.32em] text-muted">
                Enquêter • Comprendre • Éclairer • Débattre
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/les-cahiers"
                  onClick={() => setMenuOpen(false)}
                  className="btn-editorial w-full"
                >
                  Les Cahiers
                </Link>
                <Link
                  href="/mon-compte"
                  onClick={() => setMenuOpen(false)}
                  className="btn-editorial-outline w-full"
                >
                  Mon espace
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recherche overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-background">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <span className="eyebrow-ink">Recherche</span>
            <button
              onClick={() => setSearchOpen(false)}
              className="flex h-9 w-9 items-center justify-center text-ink"
              aria-label="Fermer la recherche"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="container-narrow py-12">
            <form action="/recherche" role="search" className="flex flex-col gap-4">
              <label htmlFor="q" className="eyebrow-muted">
                Rechercher dans les Cahiers
              </label>
              <div className="flex items-center gap-3 border-b-2 border-ink pb-3">
                <Search className="h-5 w-5 text-ink" />
                <input
                  id="q"
                  name="q"
                  type="search"
                  autoFocus
                  placeholder="Gouvernance, Le Gosier, enquête…"
                  className="w-full bg-transparent text-[18px] text-ink outline-none placeholder:text-muted"
                />
              </div>
              <button type="submit" className="btn-editorial self-start">
                Rechercher
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
