import Link from 'next/link';
import Image from 'next/image';
import type { ArticleCardData } from '@/types/editorial';
import { Clock, ArrowRight, BookOpen } from 'lucide-react';
import { getRubric, FORMAT_LABELS } from '@/lib/demo-data';
import { PremiumBadge } from './premium-badge';

interface ArticleCardProps {
  article: ArticleCardData;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

function FormatLabel({ article }: { article: ArticleCardData }) {
  const rubric = getRubric(article.rubric);
  const formatLabel = FORMAT_LABELS[article.format] ?? article.format;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="eyebrow">{formatLabel}</span>
      {rubric && (
        <>
          <span className="h-3 w-px bg-border" aria-hidden />
          <span className="eyebrow-muted">{rubric.shortLabel}</span>
        </>
      )}
      <PremiumBadge accessType={article.accessType} />
    </div>
  );
}

export function ArticleCard({ article, variant = 'default', className }: ArticleCardProps) {
  if (variant === 'featured') {
    return (
      <article className={className}>
        <Link href={`/enquetes/${article.slug}`} className="group block">
          {article.image && (
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-background-soft">
              <Image
                src={article.image}
                alt={article.imageAlt ?? article.title}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                priority
              />
            </div>
          )}
          <div className="mt-5 flex flex-col">
            <FormatLabel article={article} />
            <h3 className="article-title mt-2 text-[26px] leading-[1.06] sm:text-[34px] lg:text-[40px]">
              {article.title}
            </h3>
            <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-text">
              {article.excerpt}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
              {article.chapters && (
                <>
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {article.chapters} chapitres
                  </span>
                  <span aria-hidden>•</span>
                </>
              )}
              <span>{article.author}</span>
              <span aria-hidden>•</span>
              <span>{article.date}</span>
              <span aria-hidden>•</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {article.readingTime} min
              </span>
            </div>
            <span className="mt-5 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
              Lire l’enquête
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article className={className}>
        <Link href={`/enquetes/${article.slug}`} className="group block border-t border-border pt-4">
          <FormatLabel article={article} />
          <h3 className="article-title mt-1.5 text-[18px] leading-[1.15] group-hover:text-primary">
            {article.title}
          </h3>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-muted">
            <span>{article.date}</span>
            <span aria-hidden>•</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {article.readingTime} min
            </span>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className={className}>
      <Link href={`/enquetes/${article.slug}`} className="group flex h-full flex-col">
        {article.image && (
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-background-soft">
            <Image
              src={article.image}
              alt={article.imageAlt ?? article.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
          </div>
        )}
        <div className="mt-4 flex flex-1 flex-col border-t border-border pt-3">
          <FormatLabel article={article} />
          <h3 className="article-title mt-1.5 text-[20px] leading-[1.12] group-hover:text-primary">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="mt-2 text-[14px] leading-relaxed text-text line-clamp-3">
              {article.excerpt}
            </p>
          )}
          <div className="mt-3 flex items-center gap-3 text-[11px] text-muted">
            <span>{article.date}</span>
            <span aria-hidden>•</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {article.readingTime} min
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
