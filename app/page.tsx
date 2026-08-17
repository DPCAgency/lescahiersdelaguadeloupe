import { HomeHero } from '@/components/homepage/home-hero';
import { WhoDecides } from '@/components/homepage/who-decides';
import { EditorialIntro } from '@/components/homepage/editorial-intro';
import { DossierSection } from '@/components/homepage/dossier-section';
import { LatestInvestigations } from '@/components/homepage/latest-investigations';
import { AnalysisSection } from '@/components/homepage/analysis-section';
import { TerritoriesSection } from '@/components/homepage/territories-section';
import { LatestIssue } from '@/components/homepage/latest-issue';
import { MethodSection } from '@/components/homepage/method-section';
import { NewsletterSection } from '@/components/homepage/newsletter-section';
import { IssueBar } from '@/components/layout/issue-bar';
import { KeyFigures } from '@/components/editorial/key-figures';
import { Timeline } from '@/components/editorial/timeline';
import { CentralQuestion } from '@/components/editorial/central-question';
import { SectionTitle } from '@/components/editorial/section-title';
import { getHomepageData } from '@/lib/homepage-data';
import { issueBarData } from '@/data/homepage';
import { issueN02 } from '@/data/issues';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const data = await getHomepageData();

  return (
    <>
      {/* 1 — Issue Bar */}
      <IssueBar number={issueBarData.number} date={issueBarData.date} tagline={issueBarData.tagline} />

      {/* 2 — Grande Une */}
      <HomeHero />

      {/* 3 — Qui décide ? */}
      <WhoDecides actors={data.whoDecides.actors} intro={data.whoDecides.intro} />

      {/* 4 — Introduction éditoriale */}
      <EditorialIntro
        label={data.editorialIntro.label}
        title={data.editorialIntro.title}
        question={data.editorialIntro.question}
      />

      {/* 5 — Le dossier */}
      <DossierSection chapters={data.dossier.chapters} />

      {/* 6 — Chiffres clés */}
      <section className="border-t border-border bg-background-soft">
        <div className="container-editorial py-14 lg:py-20">
          <SectionTitle eyebrow="Repères" title="Les chiffres clés" />
          <div className="mt-10">
            <KeyFigures figures={data.keyFigures} />
          </div>
        </div>
      </section>

      {/* 7 — Chronologie */}
      <section className="border-t border-border">
        <div className="container-editorial py-14 lg:py-20">
          <SectionTitle eyebrow="Repères" title="Chronologie" />
          <div className="mt-10">
            <Timeline events={data.timeline} />
          </div>
        </div>
      </section>

      {/* 8 — Question centrale */}
      <section className="border-t border-border bg-background-soft">
        <div className="container-editorial py-14 lg:py-20">
          <div className="max-w-4xl">
            <CentralQuestion question={data.centralQuestion} />
          </div>
        </div>
      </section>

      {/* 9 — Dernières enquêtes */}
      <LatestInvestigations articles={data.latestInvestigations} />

      {/* 10 — Analyses & décryptages */}
      <AnalysisSection articles={data.analysis} />

      {/* 11 — Territoires */}
      <TerritoriesSection
        title={data.territories.title}
        subtitle={data.territories.subtitle}
        communes={data.territories.communes}
      />

      {/* 12 — Dernier Cahier */}
      <LatestIssue issue={issueN02} />

      {/* 13 — Notre méthode */}
      <MethodSection title={data.method.title} steps={data.method.steps} />

      {/* 14 — Newsletter */}
      <NewsletterSection
        title={data.newsletter.title}
        text={data.newsletter.text}
        placeholder={data.newsletter.placeholder}
        buttonText={data.newsletter.buttonText}
        notice={data.newsletter.notice}
      />
    </>
  );
}
