import { RubricPage } from '@/components/editorial/rubric-page';
import { getRubric, FEATURED_ARTICLES } from '@/lib/demo-data';

export const metadata = {
  title: 'Économie',
  description: 'Entreprises, tourisme, emploi, finances publiques et développement local en Guadeloupe.',
};

export default function Page() {
  const rubric = getRubric('economie')!;
  return <RubricPage rubric={rubric} articles={FEATURED_ARTICLES} />;
}
