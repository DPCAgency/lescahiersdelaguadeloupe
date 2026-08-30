import Link from 'next/link';
import { ArrowRight, BookOpen, Download } from 'lucide-react';

export const metadata = {
  title: 'Achat confirmé',
  description: 'Merci pour votre achat.',
};

export default function Page() {
  return (
    <section className="flex min-h-[70vh] items-center">
      <div className="container-narrow py-16">
        <p className="eyebrow">Confirmation</p>
        <h1 className="display-title mt-4 text-[36px] leading-[0.96] sm:text-[48px] lg:text-[60px]">
          Merci pour
          <br />
          <span className="text-primary">votre achat.</span>
        </h1>
        <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-text">
          Votre achat est confirmé. Vous pouvez commencer votre lecture immédiatement ou
          télécharger votre fichier.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/enquetes/qui-gouverne-reellement-le-gosier" className="btn-editorial">
            Lire maintenant
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/mon-compte/bibliotheque" className="btn-editorial-outline">
            <BookOpen className="h-4 w-4" />
            Ma bibliothèque
          </Link>
          <Link href="/les-cahiers/numero-02" className="btn-editorial-outline">
            <Download className="h-4 w-4" />
            Télécharger le PDF
          </Link>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-[14px] text-muted">
            Retrouvez tous vos achats dans votre{' '}
            <Link href="/mon-compte/achats" className="font-semibold text-primary hover:text-primary-dark">
              historique d'achats
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
