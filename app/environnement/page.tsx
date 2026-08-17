import { RubricPage } from '@/components/editorial/rubric-page';
import { getRubric, FEATURED_ARTICLES } from '@/lib/demo-data';

export const metadata = {
  title: 'Environnement',
  description: 'Eau, pollution, déchets, énergie, littoral et biodiversité en Guadeloupe.',
};

export default function Page() {
  const rubric = getRubric('environnement')!;
  return <RubricPage rubric={rubric} articles={FEATURED_ARTICLES} />;
}
