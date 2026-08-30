import Link from 'next/link';
import { ArticleCard } from '@/components/editorial/article-card';
import { SectionTitle } from '@/components/editorial/section-title';
import type { Rubric, ArticleCardData } from '@/types/editorial';
import { ArrowRight } from 'lucide-react';

interface RubricPageProps {
  rubric: Rubric;
  articles: ArticleCardData[];
}

export function RubricPage({ rubric, articles }: RubricPageProps) {
  const rubricArticles = articles.filter((a) => a.rubric === rubric.slug);

  return (
    <>
      {/* Hero rubrique */}
      <section className="border-b border-ink">
        <div className="container-editorial py-14 lg:py-20">
          <p className="eyebrow">Rubrique</p>
          <h1 className="display-title mt-4 text-[40px] leading-[0.95] sm:text-[56px] lg:text-[72px]">
            {rubric.label}
          </h1>
          <p className="mt-5 max-w-2xl text-[18px] leading-relaxed text-text">
            {rubric.description}
          </p>
        </div>
      </section>

      {/* Sous-thématiques */}
      <section className="border-b border-border bg-background-soft">
        <div className="container-editorial py-8">
          <p className="eyebrow-muted mb-4">Sous-thématiques</p>
          <div className="flex flex-wrap gap-2">
            {rubric.subtopics.map((sub) => (
              <span
                key={sub}
                className="border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-text"
              >
                {sub}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="container-editorial py-14 lg:py-20">
        {rubricArticles.length > 0 ? (
          <>
            <SectionTitle eyebrow="Articles" title={`${rubricArticles.length} article${rubricArticles.length > 1 ? 's' : ''}`} />
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {rubricArticles.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-start gap-4">
            <SectionTitle eyebrow="Articles" title="Aucun article publié" />
            <p className="text-[16px] text-text">
              Les articles de cette rubrique seront publiés prochainement. En attendant, découvrez
              nos enquêtes en cours.
            </p>
            <Link href="/enquetes" className="btn-editorial">
              Voir les enquêtes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
