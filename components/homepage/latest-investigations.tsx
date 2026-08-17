import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ArticleCard } from '@/components/editorial/article-card';
import type { ArticleCardData } from '@/types/editorial';

interface LatestInvestigationsProps {
  articles: ArticleCardData[];
}

export function LatestInvestigations({ articles }: LatestInvestigationsProps) {
  if (!articles || articles.length === 0) return null;
  const [featured, ...rest] = articles;
  const secondary = rest.slice(0, 2);

  return (
    <section className="border-t border-border">
      <div className="container-editorial py-14 lg:py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Enquêtes</p>
            <h2 className="section-title mt-2 text-[28px] sm:text-[36px] lg:text-[44px]">
              Dernières enquêtes
            </h2>
          </div>
          <Link
            href="/enquetes"
            className="hidden items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-primary hover:text-primary-dark sm:inline-flex"
          >
            Toutes les enquêtes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <ArticleCard article={featured} variant="featured" />
          </div>
          <div className="flex flex-col gap-8 lg:col-span-5">
            {secondary.map((a) => (
              <ArticleCard key={a.slug} article={a} variant="compact" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
