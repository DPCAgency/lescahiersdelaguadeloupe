import Link from 'next/link';
import { BookOpen, LockKeyhole, ArrowRight } from 'lucide-react';
import { ISSUE_N2, ISSUE_N2_PAGES } from '@/lib/demo-data';

export const metadata = {
  title: 'Ma bibliothèque',
  description: 'Vos Cahiers et vos lectures débloquées.',
};

export default function Page() {
  const paidPages = ISSUE_N2_PAGES.filter((page) => !page.isFree);

  return (
    <section className="border-b border-border">
      <div className="container-editorial py-12 lg:py-16">
        <p className="eyebrow">Espace lecteur</p>
        <h1 className="display-title mt-3 text-[32px] leading-[0.98] sm:text-[44px]">Ma bibliothèque</h1>
        <p className="mt-3 text-[15px] text-text">Retrouvez les Cahiers que vous lisez et les pages débloquées.</p>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <article className="border border-border bg-background p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center border border-ink text-ink">
                <BookOpen className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <div>
                <p className="eyebrow">Mes Cahiers</p>
                <h2 className="article-title mt-1 text-[22px]">{ISSUE_N2.number} · {ISSUE_N2.title}</h2>
              </div>
            </div>
            <p className="mt-5 text-[14px] leading-relaxed text-text">
              Couverture et première page gratuites. Votre lecture peut être reprise à tout moment.
            </p>
            <Link href="/les-cahiers/numero-02/lire" className="btn-editorial mt-6">
              Reprendre la lecture
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>

          <article className="border border-border bg-background p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center border border-primary text-primary">
                <LockKeyhole className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <div>
                <p className="eyebrow">Mes lectures</p>
                <h2 className="article-title mt-1 text-[22px]">Pages débloquées</h2>
              </div>
            </div>
            <p className="mt-5 text-[14px] leading-relaxed text-text">
              {paidPages.length} pages payantes sont disponibles à l'achat page par page dans le lecteur.
            </p>
            <Link href="/les-cahiers/numero-02/lire" className="btn-editorial-outline mt-6">
              Voir les pages
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
