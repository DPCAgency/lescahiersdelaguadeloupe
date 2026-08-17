import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { IssueSummary } from '@/types/editorial';

interface IssueCardProps {
  issue: IssueSummary;
  href: string;
}

export function IssueCard({ issue, href }: IssueCardProps) {
  return (
    <article className="group flex flex-col">
      <Link href={href} className="block">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-background-soft">
          <Image
            src={issue.cover ?? 'https://images.pexels.com/photos/38129343/pexels-photo-38129343.jpeg?auto=compress&cs=tinysrgb&w=600'}
            alt={`Couverture ${issue.number} — ${issue.title}`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
        </div>
      </Link>
      <div className="mt-4 flex flex-col border-t border-border pt-3">
        <div className="flex items-center gap-3">
          <span className="font-display text-[14px] font-bold uppercase tracking-[0.04em] text-ink">
            {issue.number}
          </span>
          <span className="h-3 w-px bg-border" aria-hidden />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            {issue.date}
          </span>
        </div>
        <Link href={href}>
          <h3 className="mt-2 article-title text-[20px] leading-[1.12] group-hover:text-primary">
            {issue.title}
          </h3>
        </Link>
        <p className="mt-2 text-[14px] leading-relaxed text-text line-clamp-2">
          {issue.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[12px] text-muted">{issue.pageCount} pages</span>
          <Link
            href={href}
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary"
          >
            Découvrir
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  );
}
