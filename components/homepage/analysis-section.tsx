import { ArticleCard } from '@/components/editorial/article-card';
import type { ArticleCardData } from '@/types/editorial';

interface AnalysisSectionProps {
  articles: ArticleCardData[];
}

export function AnalysisSection({ articles }: AnalysisSectionProps) {
  if (!articles || articles.length === 0) return null;

  return (
    <section className="border-t border-border bg-background-soft">
      <div className="container-editorial py-14 lg:py-20">
        <div>
          <p className="eyebrow">Formats</p>
          <h2 className="section-title mt-2 text-[28px] sm:text-[36px] lg:text-[44px]">
            Analyses &amp; décryptages
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard key={a.slug} article={a} variant="default" />
          ))}
        </div>
      </div>
    </section>
  );
}
