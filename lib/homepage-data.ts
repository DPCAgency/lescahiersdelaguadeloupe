import { supabaseAdmin } from '@/lib/supabase/server';
import {
  heroData,
  whoDecidesData,
  editorialIntroData,
  dossierData,
  keyFiguresData,
  timelineData,
  centralQuestionData,
  latestInvestigationsData,
  analysisData,
  territoriesData,
  methodData,
  newsletterData,
} from '@/data/homepage';
import { issueN02 } from '@/data/issues';
import type { KeyFigure, TimelineEvent, ActorNode, ChapterItem, ArticleCardData, Commune } from '@/types/editorial';

export interface HomepageData {
  hero: typeof heroData;
  whoDecides: typeof whoDecidesData;
  editorialIntro: typeof editorialIntroData;
  dossier: typeof dossierData;
  keyFigures: KeyFigure[];
  timeline: TimelineEvent[];
  centralQuestion: string;
  latestInvestigations: ArticleCardData[];
  analysis: ArticleCardData[];
  territories: { title: string; subtitle: string; communes: Commune[] };
  method: typeof methodData;
  newsletter: typeof newsletterData;
  latestIssueSlug: string;
}

function safeParse<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return fallback; }
  }
  return value as T;
}

export async function getHomepageData(): Promise<HomepageData> {
  const { data: sections, error } = await supabaseAdmin
    .from('homepage_sections')
    .select('*')
    .eq('is_visible', true)
    .order('position', { ascending: true });

  if (error || !sections || sections.length === 0) {
    return {
      hero: heroData,
      whoDecides: whoDecidesData,
      editorialIntro: editorialIntroData,
      dossier: dossierData,
      keyFigures: keyFiguresData,
      timeline: timelineData,
      centralQuestion: centralQuestionData,
      latestInvestigations: latestInvestigationsData,
      analysis: analysisData,
      territories: territoriesData,
      method: methodData,
      newsletter: newsletterData,
      latestIssueSlug: 'numero-02',
    };
  }

  const find = (type: string) => sections.find((s) => s.type === type);

  const heroSection = find('hero');
  const hero = heroSection
    ? {
        label: safeParse<string>(heroSection.settings_json?.label ?? heroData.label, heroData.label),
        title: safeParse<string>(heroSection.settings_json?.title ?? heroData.title, heroData.title),
        issueNumber: safeParse<string>(heroSection.settings_json?.issueNumber ?? heroData.issueNumber, heroData.issueNumber),
        issueDate: safeParse<string>(heroSection.settings_json?.issueDate ?? heroData.issueDate, heroData.issueDate),
        excerpt: safeParse<string>(heroSection.settings_json?.excerpt ?? heroData.excerpt, heroData.excerpt),
        ctaPrimary: safeParse(heroSection.settings_json?.ctaPrimary ?? heroData.ctaPrimary, heroData.ctaPrimary),
        ctaSecondary: safeParse(heroSection.settings_json?.ctaSecondary ?? heroData.ctaSecondary, heroData.ctaSecondary),
      }
    : heroData;

  const whoDecidesSection = find('who_decides');
  const whoDecides = whoDecidesSection
    ? {
        intro: safeParse<string>(whoDecidesSection.settings_json?.intro ?? whoDecidesData.intro, whoDecidesData.intro),
        actors: safeParse<ActorNode[]>(whoDecidesSection.settings_json?.actors ?? whoDecidesData.actors, whoDecidesData.actors),
      }
    : whoDecidesData;

  const editorialIntroSection = find('editorial_intro');
  const editorialIntro = editorialIntroSection
    ? {
        label: safeParse<string>(editorialIntroSection.settings_json?.label ?? editorialIntroData.label, editorialIntroData.label),
        title: safeParse<string>(editorialIntroSection.settings_json?.title ?? editorialIntroData.title, editorialIntroData.title),
        question: safeParse<string>(editorialIntroSection.settings_json?.question ?? editorialIntroData.question, editorialIntroData.question),
      }
    : editorialIntroData;

  const dossierSection = find('dossier');
  const dossier = dossierSection
    ? {
        title: safeParse<string>(dossierSection.settings_json?.title ?? dossierData.title, dossierData.title),
        subtitle: safeParse<string>(dossierSection.settings_json?.subtitle ?? dossierData.subtitle, dossierData.subtitle),
        chapters: safeParse<ChapterItem[]>(dossierSection.settings_json?.chapters ?? dossierData.chapters, dossierData.chapters),
      }
    : dossierData;

  const keyFiguresSection = find('key_figures');
  const keyFigures = keyFiguresSection
    ? safeParse<KeyFigure[]>(keyFiguresSection.settings_json?.figures ?? keyFiguresData, keyFiguresData)
    : keyFiguresData;

  const timelineSection = find('timeline');
  const timeline = timelineSection
    ? safeParse<TimelineEvent[]>(timelineSection.settings_json?.events ?? timelineData, timelineData)
    : timelineData;

  const centralQuestionSection = find('central_question');
  const centralQuestion = centralQuestionSection
    ? safeParse<string>(centralQuestionSection.settings_json?.question ?? centralQuestionData, centralQuestionData)
    : centralQuestionData;

  const latestInvestigationsSection = find('latest_investigations');
  const latestInvestigations = latestInvestigationsSection
    ? safeParse<ArticleCardData[]>(latestInvestigationsSection.settings_json?.articles ?? latestInvestigationsData, latestInvestigationsData)
    : latestInvestigationsData;

  const analysisSection = find('analysis');
  const analysis = analysisSection
    ? safeParse<ArticleCardData[]>(analysisSection.settings_json?.articles ?? analysisData, analysisData)
    : analysisData;

  const territoriesSection = find('territories');
  const territories = territoriesSection
    ? {
        title: safeParse<string>(territoriesSection.settings_json?.title ?? territoriesData.title, territoriesData.title),
        subtitle: safeParse<string>(territoriesSection.settings_json?.subtitle ?? territoriesData.subtitle, territoriesData.subtitle),
        communes: safeParse<Commune[]>(territoriesSection.settings_json?.communes ?? territoriesData.communes, territoriesData.communes),
      }
    : territoriesData;

  const methodSection = find('method');
  const method = methodSection
    ? {
        title: safeParse<string>(methodSection.settings_json?.title ?? methodData.title, methodData.title),
        steps: safeParse<typeof methodData.steps>(methodSection.settings_json?.steps ?? methodData.steps, methodData.steps),
      }
    : methodData;

  const newsletterSection = find('newsletter');
  const newsletter = newsletterSection
    ? {
        title: safeParse<string>(newsletterSection.settings_json?.title ?? newsletterData.title, newsletterData.title),
        text: safeParse<string>(newsletterSection.settings_json?.text ?? newsletterData.text, newsletterData.text),
        placeholder: safeParse<string>(newsletterSection.settings_json?.placeholder ?? newsletterData.placeholder, newsletterData.placeholder),
        buttonText: safeParse<string>(newsletterSection.settings_json?.buttonText ?? newsletterData.buttonText, newsletterData.buttonText),
        notice: safeParse<string>(newsletterSection.settings_json?.notice ?? newsletterData.notice, newsletterData.notice),
      }
    : newsletterData;

  const latestIssueSection = find('latest_issue');
  const latestIssueSlug = latestIssueSection
    ? safeParse<string>(latestIssueSection.settings_json?.issueSlug ?? 'numero-02', 'numero-02')
    : 'numero-02';

  return {
    hero,
    whoDecides,
    editorialIntro,
    dossier,
    keyFigures,
    timeline,
    centralQuestion,
    latestInvestigations,
    analysis,
    territories,
    method,
    newsletter,
    latestIssueSlug,
  };
}

export async function getIssueBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('issues')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error || !data) {
    return { issue: issueN02, pages: null };
  }

  const { data: pages } = await supabaseAdmin
    .from('issue_pages')
    .select('*')
    .eq('issue_id', data.id)
    .order('page_number', { ascending: true });

  return { issue: data, pages };
}
