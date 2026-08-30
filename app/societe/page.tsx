import { RubricPage } from '@/components/editorial/rubric-page';
import { getRubric, FEATURED_ARTICLES } from '@/lib/demo-data';

export const metadata = {
  title: 'Société',
  description: 'Santé, éducation, jeunesse, vie quotidienne et services publics en Guadeloupe.',
};

export default function Page() {
  const rubric = getRubric('societe')!;
  return <RubricPage rubric={rubric} articles={FEATURED_ARTICLES} />;
}
