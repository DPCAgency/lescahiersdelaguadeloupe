import { RubricPage } from '@/components/editorial/rubric-page';
import { getRubric, FEATURED_ARTICLES } from '@/lib/demo-data';

export const metadata = {
  title: 'Territoires',
  description: 'Le traitement territorial de la Guadeloupe, commune par commune.',
};

export default function Page() {
  const rubric = getRubric('territoires')!;
  return <RubricPage rubric={rubric} articles={FEATURED_ARTICLES} />;
}
