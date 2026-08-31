import { IssueCard } from '@/components/editorial/issue-card';
import { supabaseAdmin } from '@/lib/supabase/server';
import { issues as fallbackIssues } from '@/data/issues';
import type { IssueSummary } from '@/types/editorial';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Les Cahiers',
  description: 'Bibliothèque des numéros des Cahiers de la Guadeloupe.',
};

export default async function Page() {
  const { data, error } = await supabaseAdmin
    .from('issues')
    .select('*')
    .eq('status', 'published')
    .order('publication_date', { ascending: false });

  let issueList: IssueSummary[] = fallbackIssues;

  if (!error && data && data.length > 0) {
    issueList = data.map((row) => ({
      number: `N°${row.issue_number}`,
      date: row.publication_date
        ? new Date(row.publication_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
        : '',
      title: row.title,
      subtitle: row.subtitle ?? '',
      cover: row.cover_image_path ?? '',
      description: row.description ?? '',
      pageCount: row.page_count,
      pricePerPage: row.price_per_page,
      fullDownloadPrice: row.full_download_price,
      pdfFile: row.pdf_file_path ?? '',
      slug: row.slug,
    }));
  }

  return (
    <>
      <section className="border-b border-ink">
        <div className="container-editorial py-14 lg:py-20">
          <p className="eyebrow">Bibliothèque</p>
          <h1 className="display-title mt-4 text-[40px] leading-[0.95] sm:text-[56px] lg:text-[72px]">
            Les Cahiers
          </h1>
          <p className="mt-5 max-w-2xl text-[18px] leading-relaxed text-text">
            La collection des numéros de la revue. Chaque cahier est une publication numérique
            structurée page par page. Lisez les cahiers en ligne ou téléchargez-les au format PDF.
          </p>
        </div>
      </section>

      <section className="container-editorial py-14 lg:py-20">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {issueList.map((issue) => (
            <IssueCard
              key={issue.number}
              issue={issue}
              href={`/les-cahiers/${issue.slug ?? issue.number.replace('N°', 'numero-').toLowerCase()}`}
            />
          ))}
        </div>
      </section>
    </>
  );
}
