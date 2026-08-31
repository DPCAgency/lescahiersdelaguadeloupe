import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen } from 'lucide-react';
import type { IssueSummary } from '@/types/editorial';
import { formatPrice } from '@/lib/utils/format';

interface LatestIssueProps {
  issue: IssueSummary;
}

export function LatestIssue({ issue }: LatestIssueProps) {
  return (
    <section className="border-t border-ink bg-ink text-white">
      <div className="container-editorial py-14 lg:py-20">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
              Le dernier numéro
            </p>
            <p className="mt-4 font-display text-[48px] font-bold leading-none text-white sm:text-[64px] lg:text-[80px]">
              {issue.number}
            </p>
            <h2 className="mt-4 font-display text-[24px] font-bold uppercase leading-[1.05] sm:text-[32px] lg:text-[40px]">
              {issue.title}
            </h2>
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-white/70">
              {issue.description}
            </p>
            <div className="mt-6 flex items-center gap-4 text-[13px] text-white/60">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                {issue.pageCount} pages
              </span>
              <span aria-hidden>•</span>
              <span>Accès libre</span>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/les-cahiers/numero-02/lire"
                className="btn-editorial border-primary bg-primary hover:bg-primary-dark hover:border-primary-dark"
              >
                Commencer la lecture
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/les-cahiers/numero-02"
                className="inline-flex items-center justify-center gap-2 border border-white/30 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/10"
              >
                Découvrir le cahier
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="relative aspect-[3/4] w-full bg-white/5">
              <Image
                src={issue.cover ?? 'https://images.pexels.com/photos/38129343/pexels-photo-38129343.jpeg?auto=compress&cs=tinysrgb&w=800'}
                alt={`Couverture ${issue.number} · Les Cahiers de la Guadeloupe`}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
            <p className="mt-3 text-right text-[12px] text-white/50">
              {issue.pageCount} pages
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
