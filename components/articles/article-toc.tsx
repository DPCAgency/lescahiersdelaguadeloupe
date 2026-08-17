'use client';

import { useEffect, useState } from 'react';
import { X, Menu } from 'lucide-react';

export interface TocItem {
  id: string;
  label: string;
  index: string;
}

interface ReadingProgressProps {
  items: TocItem[];
}

export function ArticleToc({ items }: ReadingProgressProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );
    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setOpen(false);
    }
  };

  return (
    <>
      {/* Bouton mobile */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-40 flex items-center gap-2 border border-ink bg-background px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink shadow-lg lg:hidden"
        aria-label="Ouvrir le sommaire"
      >
        <Menu className="h-4 w-4" />
        Sommaire
      </button>

      {/* Desktop sticky */}
      <nav className="sticky top-32 hidden h-[calc(100vh-160px)] flex-col lg:flex" aria-label="Sommaire">
        <p className="eyebrow-ink mb-4">Sommaire</p>
        <ol className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => handleClick(e, item.id)}
                className={`group flex items-baseline gap-3 border-l-2 py-0.5 pl-3 transition-colors ${
                  activeId === item.id
                    ? 'border-primary text-primary'
                    : 'border-border text-muted hover:text-ink'
                }`}
              >
                <span className="font-display text-[13px] font-semibold">{item.index}</span>
                <span className="text-[13px] font-medium leading-tight">{item.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* Overlay mobile */}
      {open && (
        <div className="fixed inset-0 z-[70] bg-background lg:hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <span className="eyebrow-ink">Sommaire</span>
            <button onClick={() => setOpen(false)} aria-label="Fermer" className="flex h-9 w-9 items-center justify-center">
              <X className="h-5 w-5" />
            </button>
          </div>
          <ol className="flex flex-col px-5 py-4">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleClick(e, item.id)}
                  className={`flex items-baseline gap-4 border-b border-border py-4 ${
                    activeId === item.id ? 'text-primary' : 'text-ink'
                  }`}
                >
                  <span className="font-display text-[20px] font-bold">{item.index}</span>
                  <span className="article-title text-[20px]">{item.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
}
