import Link from 'next/link';
import { Receipt, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Mes achats',
  description: 'Votre historique d’achats des Cahiers.',
};

export default function Page() {
  return (
    <section className="border-b border-border">
      <div className="container-editorial py-12 lg:py-16">
        <p className="eyebrow">Espace lecteur</p>
        <h1 className="display-title mt-3 text-[32px] leading-[0.98] sm:text-[44px]">Mes achats</h1>
        <div className="mt-10 border border-border bg-background p-8 text-center sm:p-12">
          <Receipt className="mx-auto h-8 w-8 text-primary" strokeWidth={1.5} />
          <h2 className="article-title mt-4 text-[22px]">Aucun achat enregistré</h2>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-muted">
            Vos achats de pages et de Cahiers complets apparaîtront ici avec leur accès et leur facture.
          </p>
          <Link href="/les-cahiers" className="btn-editorial mt-6">
            Découvrir les Cahiers
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
