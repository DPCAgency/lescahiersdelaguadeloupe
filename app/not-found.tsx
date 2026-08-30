import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] items-center">
      <div className="container-editorial py-20">
        <p className="eyebrow">Erreur 404</p>
        <h1 className="display-title mt-4 text-[44px] sm:text-[64px] lg:text-[80px]">
          Cette page reste
          <br />
          <span className="text-primary">introuvable.</span>
        </h1>
        <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-text">
          Notre enquête s’arrête ici. La page que vous cherchez n’existe pas, a été déplacée ou
          n’a jamais été publiée.
        </p>
        <Link href="/" className="btn-editorial mt-8">
          Revenir à l’accueil
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
