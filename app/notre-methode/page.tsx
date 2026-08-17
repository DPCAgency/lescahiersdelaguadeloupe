import { SectionTitle } from '@/components/editorial/section-title';
import { Search, BookOpen, Lightbulb, MessageSquareText } from 'lucide-react';

export const metadata = {
  title: 'Notre méthode',
  description:
    'Les Cahiers de la Guadeloupe distinguent systématiquement les faits, les témoignages, les rapprochements, l’analyse et les hypothèses.',
};

const METHOD = [
  {
    icon: Search,
    title: 'Enquêter',
    items: ['Documents publics', 'Témoignages', 'Décisions', 'Données', 'Chronologies'],
  },
  {
    icon: BookOpen,
    title: 'Comprendre',
    items: ['Contexte', 'Institutions', 'Acteurs', 'Mécanismes', 'Enjeux'],
  },
  {
    icon: Lightbulb,
    title: 'Éclairer',
    items: [
      'Confronter les informations',
      'Mettre en perspective',
      'Identifier les zones d’ombre',
      'Présenter ce que les documents permettent ou non d’établir',
    ],
  },
  {
    icon: MessageSquareText,
    title: 'Débattre',
    items: ['Droit de réponse', 'Contradiction', 'Contributions', 'Explications des personnes citées'],
  },
];

export default function Page() {
  return (
    <>
      <section className="border-b border-ink">
        <div className="container-editorial py-14 lg:py-20">
          <p className="eyebrow">La rédaction</p>
          <h1 className="display-title mt-4 text-[40px] leading-[0.95] sm:text-[56px] lg:text-[72px]">
            Notre méthode
          </h1>
          <p className="mt-6 max-w-2xl text-[18px] leading-relaxed text-text">
            Les Cahiers de la Guadeloupe distinguent systématiquement ce qui relève des faits, des
            témoignages, des rapprochements, de l’analyse et des hypothèses.
          </p>
        </div>
      </section>

      {/* Les quatre temps de la méthode */}
      <section className="container-editorial py-14 lg:py-20">
        <div className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2">
          {METHOD.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.title} className="bg-background p-8 sm:p-10">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center border border-ink text-ink">
                    <Icon className="h-6 w-6" strokeWidth={1.5} />
                  </span>
                  <h2 className="section-title text-[28px] sm:text-[34px]">{m.title}</h2>
                </div>
                <ul className="mt-6 flex flex-col gap-3">
                  {m.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[15px] text-text">
                      <span className="mt-2 h-1 w-1 shrink-0 bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Principes */}
      <section className="border-t border-border bg-background-soft">
        <div className="container-narrow py-16 lg:py-24">
          <SectionTitle eyebrow="Principes" title="Ce que nous garantissons" align="center" />
          <div className="mt-10 flex flex-col gap-6">
            {[
              'Les faits sont présentés comme des faits.',
              'Les témoignages sont identifiés comme tels.',
              'Les rapprochements restent des rapprochements.',
              'Les hypothèses restent des hypothèses.',
            ].map((principle, i) => (
              <div key={i} className="flex items-baseline gap-4 border-b border-border pb-5">
                <span className="font-display text-[28px] font-bold text-primary">{String(i + 1).padStart(2, '0')}</span>
                <p className="font-serif text-[20px] leading-[1.4] text-ink sm:text-[24px]">{principle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signature */}
      <section className="border-t border-ink bg-ink text-white">
        <div className="container-editorial py-10 text-center">
          <p className="text-[14px] font-semibold uppercase tracking-[0.32em] text-white/85 sm:text-[16px]">
            Enquêter • Comprendre • Éclairer • Débattre
          </p>
        </div>
      </section>
    </>
  );
}
