import { RubricPage } from '@/components/editorial/rubric-page';
import { getRubric, FEATURED_ARTICLES } from '@/lib/demo-data';

export const metadata = {
  title: 'Culture',
  description: 'Patrimoine, musique, littérature, identité, création et mémoire en Guadeloupe.',
};

export default function Page() {
  const rubric = getRubric('culture')!;
  return <RubricPage rubric={rubric} articles={FEATURED_ARTICLES} />;
}
