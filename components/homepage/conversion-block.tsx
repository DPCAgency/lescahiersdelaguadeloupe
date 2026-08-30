import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';

export function ConversionBlock() {
  return (
    <section className="border-t border-border bg-background-soft">
      <div className="container-editorial py-14 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Aller plus loin</p>
          <h2 className="section-title mt-4 text-[28px] sm:text-[36px] lg:text-[44px]">
            Accédez aux enquêtes intégrales, aux Cahiers et aux archives.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-text">
            Soutenez un journalisme indépendant. Choisissez l'abonnement ou l'achat à l'unité.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/abonnement" className="btn-editorial">
              Découvrir l'abonnement
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/les-cahiers" className="btn-editorial-outline">
              <BookOpen className="h-4 w-4" />
              Acheter le dernier Cahier
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
