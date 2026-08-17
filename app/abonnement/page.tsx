import { BookOpen } from 'lucide-react';

export const metadata = {
  title: 'Abonnement',
  description: 'Accédez aux Cahiers de la Guadeloupe.',
};

export default function Page() {
  return (
    <section className="flex min-h-[50vh] items-center">
      <div className="container-narrow py-16">
        <div className="border border-border bg-background p-8 text-center sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ink/5">
            <BookOpen className="h-7 w-7 text-ink" strokeWidth={1.5} />
          </div>
          <h1 className="display-title mt-6 text-[32px] leading-[0.98] sm:text-[40px]">
            Les Cahiers sont actuellement accessibles gratuitement
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-text">
            Tous les Cahiers publiés sont librement consultables. Les offres d'abonnement seront proposées prochainement.
          </p>
          <a href="/les-cahiers" className="btn-editorial mt-8 inline-flex">
            Consulter les Cahiers
          </a>
        </div>
      </div>
    </section>
  );
}
