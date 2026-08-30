import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface InstitutionalPageLayoutProps {
  eyebrow?: string;
  title: string;
  chapo?: string;
  breadcrumbs: { label: string; href: string }[];
  children: React.ReactNode;
  updatedAt?: string;
}

export function InstitutionalPageLayout({
  eyebrow,
  title,
  chapo,
  breadcrumbs,
  children,
  updatedAt,
}: InstitutionalPageLayoutProps) {
  return (
    <>
      <section className="border-b border-ink">
        <div className="container-editorial py-10 lg:py-16">
          <nav className="mb-6 flex items-center gap-1.5 text-[12px] text-muted">
            {breadcrumbs.map((bc, i) => (
              <span key={bc.href} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3 w-3 text-muted/60" strokeWidth={1.5} />}
                {i === breadcrumbs.length - 1 ? (
                  <span className="text-text">{bc.label}</span>
                ) : (
                  <Link href={bc.href} className="hover:text-primary transition-colors">
                    {bc.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>

          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="display-title mt-3 text-[36px] leading-[0.95] sm:text-[48px] lg:text-[60px]">
            {title}
          </h1>
          {chapo && (
            <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-text">
              {chapo}
            </p>
          )}
        </div>
      </section>

      <section className="container-narrow py-12 lg:py-16">
        <div className="body-prose space-y-8">{children}</div>
        {updatedAt && (
          <p className="mt-12 border-t border-border pt-4 text-[12px] text-muted">
            Dernière mise à jour : {new Date(updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </section>
    </>
  );
}
