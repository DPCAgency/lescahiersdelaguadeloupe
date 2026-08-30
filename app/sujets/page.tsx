import Link from 'next/link';
import { SectionTitle } from '@/components/editorial/section-title';
import { SUBJECTS } from '@/lib/demo-data';
import { ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Sujets',
  description: 'Explorez les grands dossiers des Cahiers de la Guadeloupe.',
};

export default function Page() {
  return (
    <>
      <section className="border-b border-ink">
        <div className="container-editorial py-14 lg:py-20">
          <p className="eyebrow">Explorer</p>
          <h1 className="display-title mt-4 text-[40px] leading-[0.95] sm:text-[56px] lg:text-[72px]">
            Sujets
          </h1>
          <p className="mt-5 max-w-2xl text-[18px] leading-relaxed text-text">
            Les grands dossiers traités par la rédaction. Chaque sujet rassemble les enquêtes,
            analyses et décryptages qui s’y rapportent.
          </p>
        </div>
      </section>

      <section className="container-editorial py-14 lg:py-20">
        <ul className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {SUBJECTS.map((subject) => (
            <li key={subject.slug}>
              <Link
                href={`/sujets/${subject.slug}`}
                className="group flex items-center justify-between bg-background p-6 transition-colors hover:bg-background-soft sm:p-8"
              >
                <div>
                  <h2 className="article-title text-[22px] leading-[1.1]">{subject.label}</h2>
                  <p className="mt-1 text-[12px] uppercase tracking-[0.14em] text-muted">
                    {subject.articleCount} article{subject.articleCount > 1 ? 's' : ''}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted transition-all group-hover:translate-x-1 group-hover:text-primary" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
