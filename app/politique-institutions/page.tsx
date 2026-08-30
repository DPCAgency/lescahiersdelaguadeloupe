import { RubricPage } from '@/components/editorial/rubric-page';
import { getRubric, FEATURED_ARTICLES } from '@/lib/demo-data';

export const metadata = {
  title: 'Politique & Institutions',
  description: 'Pouvoirs publics, décisions, institutions et gouvernance locale en Guadeloupe.',
};

export default function Page() {
  const rubric = getRubric('politique-institutions')!;
  return <RubricPage rubric={rubric} articles={FEATURED_ARTICLES} />;
}
