import Link from 'next/link';
import { SectionTitle } from '@/components/editorial/section-title';
import { COMMUNES } from '@/lib/demo-data';
import { ArrowRight, MapPin } from 'lucide-react';

export const metadata = {
  title: 'Communes',
  description: 'Le traitement territorial de la Guadeloupe, commune par commune.',
};

export default function Page() {
  return (
    <>
      <section className="border-b border-ink">
        <div className="container-editorial py-14 lg:py-20">
          <p className="eyebrow">Territoires</p>
          <h1 className="display-title mt-4 text-[40px] leading-[0.95] sm:text-[56px] lg:text-[72px]">
            Communes
          </h1>
          <p className="mt-5 max-w-2xl text-[18px] leading-relaxed text-text">
            La Guadeloupe, commune par commune. Chaque commune peut faire l’objet d’enquêtes,
            d’analyses et de chronologies spécifiques.
          </p>
        </div>
      </section>

      <section className="container-editorial py-14 lg:py-20">
        <ul className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {COMMUNES.map((commune) => (
            <li key={commune.slug}>
              <Link
                href={`/territoires/${commune.slug}`}
                className="group flex flex-col bg-background p-6 transition-colors hover:bg-background-soft sm:p-8"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" strokeWidth={1.5} />
                  <h2 className="article-title text-[22px] leading-[1.1]">{commune.name}</h2>
                </div>
                <p className="mt-2 text-[14px] leading-relaxed text-text">{commune.description}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Explorer
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
