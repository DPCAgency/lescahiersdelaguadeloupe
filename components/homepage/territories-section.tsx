import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Commune } from '@/types/editorial';

interface TerritoriesSectionProps {
  title: string;
  subtitle: string;
  communes: Commune[];
}

export function TerritoriesSection({ title, subtitle, communes }: TerritoriesSectionProps) {
  return (
    <section className="border-t border-border">
      <div className="container-editorial py-14 lg:py-20">
        <div className="max-w-3xl">
          <p className="eyebrow">Territoires</p>
          <h2 className="section-title mt-2 text-[28px] sm:text-[36px] lg:text-[44px]">
            {title}
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-text">{subtitle}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {communes.map((c) => (
            <Link
              key={c.slug}
              href={`/territoires/${c.slug}`}
              className="group flex flex-col bg-background p-6 transition-colors hover:bg-background-soft sm:p-8"
            >
              <h3 className="article-title text-[20px] leading-[1.1]">{c.name}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-text">{c.description}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                Explorer
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
