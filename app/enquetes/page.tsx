import Link from 'next/link';
import Image from 'next/image';
import { ArticleCard } from '@/components/editorial/article-card';
import { SectionTitle } from '@/components/editorial/section-title';
import { FEATURED_ARTICLES } from '@/lib/demo-data';
import { ArrowRight, BookOpen, Clock } from 'lucide-react';

export const metadata = {
  title: 'Enquêtes',
  description: 'Les grandes investigations des Cahiers de la Guadeloupe.',
};

export default function Page() {
  return (
    <>
      <section className="border-b border-ink">
        <div className="container-editorial py-14 lg:py-20">
          <p className="eyebrow">Format éditorial</p>
          <h1 className="display-title mt-4 text-[40px] leading-[0.95] sm:text-[56px] lg:text-[72px]">
            Enquêtes
          </h1>
          <p className="mt-5 max-w-2xl text-[18px] leading-relaxed text-text">
            Les grandes investigations de la rédaction. Chaque enquête est construite à partir de
            documents publics, de témoignages recueillis et de l’analyse des mécanismes
            institutionnels.
          </p>
        </div>
      </section>

      <section className="container-editorial py-14 lg:py-20">
        {/* Enquête principale */}
        <div className="border-b border-border pb-12">
          <Link href="/enquetes/qui-gouverne-reellement-le-gosier" className="group block">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-background-soft lg:col-span-7">
                <Image
                  src="https://images.pexels.com/photos/2120356/pexels-photo-2120356.jpeg?auto=compress&cs=tinysrgb&w=1280"
                  alt="Vue côtière de la Guadeloupe"
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  priority
                />
              </div>
              <div className="flex flex-col justify-center lg:col-span-5">
                <span className="eyebrow">Enquête · N°2</span>
                <h2 className="article-title mt-3 text-[28px] leading-[1.05] sm:text-[36px] lg:text-[44px]">
                  Qui gouverne réellement Le Gosier ?
                </h2>
                <p className="mt-4 text-[16px] leading-relaxed text-text">
                  Maire, élus, cabinet, administration, acteurs économiques : où s’exerce réellement
                  l’influence dans la fabrication de la décision publique ?
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    7 chapitres
                  </span>
                  <span aria-hidden>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    35 min
                  </span>
                  <span aria-hidden>•</span>
                  <span>15 août 2026</span>
                </div>
                <span className="mt-6 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Lire l’enquête
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Autres enquêtes */}
        <div className="mt-12">
          <SectionTitle eyebrow="À lire aussi" title="Autres articles" />
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_ARTICLES.slice(1).map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
