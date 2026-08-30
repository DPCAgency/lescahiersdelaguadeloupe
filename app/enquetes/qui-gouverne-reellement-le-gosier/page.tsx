import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock, Calendar, AlertCircle, BookOpen } from 'lucide-react';
import { ReadingProgressBar } from '@/components/articles/reading-progress';
import { ArticleToc, type TocItem } from '@/components/articles/article-toc';
import { ShareBar } from '@/components/articles/share-bar';
import { EditorialBlock } from '@/components/editorial/editorial-block';
import { EditorialQuote } from '@/components/editorial/editorial-quote';
import { KeyFigures } from '@/components/editorial/key-figures';
import { Timeline } from '@/components/editorial/timeline';
import { CentralQuestion } from '@/components/editorial/central-question';
import { WhatWeKnow } from '@/components/editorial/what-we-know';
import {
  KEY_FIGURES,
  TIMELINE_EVENTS,
  CENTRAL_QUESTION,
  WHAT_WE_KNOW,
  WHAT_WE_DONT_KNOW,
} from '@/lib/demo-data';

const TOC: TocItem[] = [
  { id: 'chapitre-01', label: 'Une enquête, pas un réquisitoire', index: '01' },
  { id: 'chapitre-02', label: 'Regarder la mécanique', index: '02' },
  { id: 'chapitre-03', label: 'Le territoire et les enjeux', index: '03' },
  { id: 'chapitre-04', label: 'Les gouvernances depuis 2021', index: '04' },
  { id: 'chapitre-05', label: 'Cabinet et entrepreneur', index: '05' },
  { id: 'chapitre-06', label: 'De la campagne à la subvention', index: '06' },
  { id: 'chapitre-07', label: 'Conclusion', index: '07' },
  { id: 'droit-reponse', label: 'Droit de réponse', index: '—' },
];

export const metadata = {
  title: 'Qui gouverne réellement Le Gosier ?',
  description:
    'Maire, élus, cabinet, administration, acteurs économiques : où s’exerce réellement l’influence dans la fabrication de la décision publique au Gosier ?',
  openGraph: {
    type: 'article',
    title: 'Qui gouverne réellement Le Gosier ? — Les Cahiers de la Guadeloupe',
    description:
      'Enquête en 7 chapitres sur la gouvernance locale au Gosier. Comprendre les rôles, les intérêts et les décisions publiques.',
    locale: 'fr_GP',
    siteName: 'Les Cahiers de la Guadeloupe',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Qui gouverne réellement Le Gosier ?',
    description: 'Enquête — Les Cahiers de la Guadeloupe N°2',
  },
};

function ChapterHeader({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="font-display text-[40px] font-bold leading-none text-primary sm:text-[56px] lg:text-[72px]">
        {index}
      </span>
      <h2 className="section-title text-[22px] leading-[1.05] sm:text-[28px] lg:text-[34px]">
        {title}
      </h2>
    </div>
  );
}

export default function EnquetePage() {
  return (
    <>
      <ReadingProgressBar readingTime={35} />

      {/* Couverture de l'enquête */}
      <header className="border-b border-border">
        <div className="container-editorial py-10 lg:py-16">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3">
              <span className="eyebrow">Enquête</span>
              <span className="h-px w-8 bg-border" aria-hidden />
              <span className="eyebrow-muted">Politique & Institutions</span>
              <span className="h-px w-8 bg-border" aria-hidden />
              <span className="eyebrow-muted">N°2 — 15 août 2026</span>
            </div>
            <h1 className="display-title mt-6 text-[40px] leading-[0.94] sm:text-[56px] lg:text-[72px] xl:text-[84px]">
              Qui gouverne
              <br />
              réellement
              <br />
              <span className="text-primary">Le Gosier ?</span>
            </h1>
            <p className="mt-6 max-w-2xl text-[18px] leading-relaxed text-text">
              Ce cahier ne désigne pas de coupables. Il pose une question : qui exerce réellement
              l’influence dans la fabrication de la décision publique au Gosier ?
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted">
              <span className="font-semibold uppercase tracking-[0.14em] text-ink">La rédaction</span>
              <span aria-hidden>•</span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                15 août 2026
              </span>
              <span aria-hidden>•</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                35 min de lecture
              </span>
              <span aria-hidden>•</span>
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                7 chapitres
              </span>
            </div>
            <div className="mt-6">
              <ShareBar title="Qui gouverne réellement Le Gosier ?" />
            </div>
          </div>
        </div>

        <div className="container-wide">
          <div className="relative aspect-[16/9] w-full bg-background-soft">
            <Image
              src="https://images.pexels.com/photos/2120356/pexels-photo-2120356.jpeg?auto=compress&cs=tinysrgb&w=1920"
              alt="Plage tropicale en Guadeloupe"
              fill
              sizes="(max-width: 1760px) 100vw, 1760px"
              className="object-cover"
              priority
            />
          </div>
          <p className="container-editorial mt-3 pb-6 text-[12px] text-muted">
            <span className="font-semibold uppercase tracking-[0.14em]">Crédit — </span>
            Photographie d’illustration. Les Cahiers de la Guadeloupe, N°2, août 2026.
          </p>
        </div>
      </header>

      {/* Corps de l'enquête */}
      <div className="container-editorial py-12 lg:py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          {/* Sommaire sticky */}
          <div className="lg:col-span-3">
            <ArticleToc items={TOC} />
          </div>

          {/* Contenu */}
          <div className="lg:col-span-9">
            {/* CHAPITRE 01 */}
            <section id="chapitre-01" className="scroll-mt-32">
              <ChapterHeader index="1" title="Une enquête, pas un réquisitoire" />
              <div className="mt-6 body-prose max-w-2xl">
                <p>
                  Ce cahier ne désigne pas de coupables. Il cherche à comprendre comment se construit
                  réellement la décision publique au Gosier. La rédaction a travaillé à partir de
                  documents publics, de témoignages recueillis auprès d’élus, d’agents municipaux et
                  d’acteurs locaux, et de l’analyse des mécanismes institutionnels.
                </p>
                <p>
                  Les faits sont présentés comme des faits. Les témoignages sont identifiés comme
                  tels. Les rapprochements restent des rapprochements. Les hypothèses restent des
                  hypothèses.
                </p>
              </div>
              <div className="mt-8 max-w-2xl">
                <EditorialBlock level="fait" title="Notre cadre">
                  Le code général des collectivités territoriales définit les compétences du maire,
                  du conseil municipal et de l’administration. C’est ce cadre qui délimite le pouvoir
                  d’autoriser, de subventionner et de décider.
                </EditorialBlock>
              </div>
            </section>

            {/* CHAPITRE 02 */}
            <section id="chapitre-02" className="mt-16 scroll-mt-32">
              <ChapterHeader index="2" title="Regarder la mécanique" />
              <div className="mt-6 body-prose max-w-2xl">
                <p>
                  La décision publique ne se résume pas à un acte formel. Elle se construit à travers
                  des étapes, des acteurs et des influences. Comprendre cette mécanique suppose
                  d’identifier qui participe, à quel titre et avec quels intérêts.
                </p>
              </div>
              <div className="mt-8 max-w-3xl">
                <CentralQuestion question={CENTRAL_QUESTION} />
              </div>
            </section>

            {/* CHAPITRE 03 */}
            <section id="chapitre-03" className="mt-16 scroll-mt-32">
              <ChapterHeader index="3" title="Le Gosier : un territoire aux enjeux économiques importants" />
              <div className="mt-6 body-prose max-w-2xl">
                <p>
                  Le Gosier est l’une des communes les plus peuplées de la Guadeloupe. Sa situation
                  centrale, entre Pointe-à-Pitre et Basse-Terre, en fait un pôle économique et
                  résidentiel majeur. Tourisme, économie nocturne, autorisations et décisions
                  publiques : les enjeux y sont considérables.
                </p>
              </div>
              <div className="mt-8">
                <KeyFigures figures={KEY_FIGURES} />
              </div>
            </section>

            {/* CHAPITRE 04 */}
            <section id="chapitre-04" className="mt-16 scroll-mt-32">
              <ChapterHeader index="4" title="Les gouvernances municipales depuis 2021" />
              <p className="mt-4 max-w-2xl text-[16px] text-text">
                Chronologie des changements politiques et des étapes clés reconstituées.
              </p>
              <div className="mt-8 max-w-2xl">
                <Timeline events={TIMELINE_EVENTS} />
              </div>
            </section>

            {/* CHAPITRE 05 */}
            <section id="chapitre-05" className="mt-16 scroll-mt-32">
              <ChapterHeader index="5" title="Directeur de cabinet et entrepreneur : où se situe la frontière ?" />
              <div className="mt-6 body-prose max-w-2xl">
                <p>
                  L’analyse des fonctions publiques et des intérêts privés est au cœur de cette
                  enquête. Le croisement des mandats, des activités professionnelles et des liens
                  avec la décision publique pose la question de la frontière entre intérêt général
                  et intérêts particuliers.
                </p>
              </div>
              <div className="mt-8 max-w-2xl">
                <EditorialBlock level="rapprochement" title="Liens croisés">
                  La rédaction a recensé plusieurs structures locales dont les dirigeants ou
                  bénéficiaires entretiennent des liens avec la décision publique municipale. Ces
                  rapprochements sont présentés comme tels — jamais comme des preuves.
                </EditorialBlock>
              </div>
              <div className="mt-8 max-w-3xl">
                <EditorialQuote
                  text="La transparence n’est pas un accessoire. Elle constitue une condition de la confiance publique."
                  level="temoignage"
                />
              </div>
            </section>

            {/* CHAPITRE 06 */}
            <section id="chapitre-06" className="mt-16 scroll-mt-32">
              <ChapterHeader index="6" title="De la campagne à la subvention" />
              <div className="mt-6 body-prose max-w-2xl">
                <p>
                  46 370,10 € : ce montant, issu de documents publics, interroge. Il met en lumière
                  le parcours entre engagement politique et bénéfice de subventions. Là encore,
                  aucune accusation n’est formulée. La question est posée.
                </p>
              </div>
              <div className="mt-8 max-w-2xl">
                <EditorialBlock level="document" title="Délibérations municipales">
                  Des délibérations du conseil municipal encadrent l’attribution de subventions à
                  des structures locales. La rédaction les examine sans préjuger de l’intention.
                </EditorialBlock>
              </div>
            </section>

            {/* CHAPITRE 07 — CONCLUSION */}
            <section id="chapitre-07" className="mt-16 scroll-mt-32">
              <ChapterHeader index="7" title="Conclusion : qui gouverne réellement Le Gosier ?" />
              <div className="mt-6 body-prose max-w-2xl">
                <p>
                  Au terme de ce parcours, la question centrale reste ouverte. Ce cahier n’apporte
                  pas de réponse définitive. Il met en lumière les mécanismes, les acteurs et les
                  zones d’ombre de la décision publique au Gosier.
                </p>
              </div>
              <div className="mt-8">
                <WhatWeKnow known={WHAT_WE_KNOW} unknown={WHAT_WE_DONT_KNOW} />
              </div>
              <div className="mt-8 max-w-2xl">
                <EditorialBlock level="question" title="Une question ouverte">
                  L’égalité devant la règle est-elle garantie à tous les acteurs de la commune ?
                </EditorialBlock>
              </div>
              <div className="mt-8 max-w-2xl">
                <EditorialBlock level="hypothese" title="Hypothèse de travail">
                  Si certains rapprochements interrogent, aucune preuve n’est apportée. Cette
                  hypothèse reste une hypothèse.
                </EditorialBlock>
              </div>
            </section>

            {/* Corrections */}
            <section className="mt-16 border-t border-border pt-8">
              <p className="eyebrow-muted mb-2">Corrections & mises à jour</p>
              <p className="text-[14px] text-muted">
                Dernière mise à jour le 15 août 2026. Aucune correction effectuée à ce jour.
              </p>
            </section>

            {/* Droit de réponse */}
            <section id="droit-reponse" className="mt-12 scroll-mt-32 border-t border-ink pt-10">
              <div className="flex flex-col gap-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h2 className="section-title text-[24px] sm:text-[28px]">Droit de réponse</h2>
                    <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-text">
                      Toute personne ou organisation citée dans cette enquête peut transmettre à la
                      rédaction des éléments complémentaires, contradictoires ou demander
                      l’exercice de son droit de réponse.
                    </p>
                  </div>
                </div>
                <Link href="/droit-de-reponse" className="btn-editorial self-start">
                  Exercer un droit de réponse
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>

            {/* Sources */}
            <section className="mt-12 border-t border-border pt-8">
              <p className="eyebrow-ink mb-4">Sources & documents</p>
              <ul className="flex flex-col gap-2 text-[14px] text-text">
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 bg-primary" />
                  Code général des collectivités territoriales (CGCT)
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 bg-primary" />
                  Délibérations du conseil municipal du Gosier (documents publics)
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 bg-primary" />
                  Décisions du tribunal administratif de Basse-Terre
                </li>
              </ul>
              <p className="mt-4 text-[12px] text-muted">
                Les sources citées sont publiques ou ont été recueillies par la rédaction. Aucune
                source inexistante n’a été créée.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
