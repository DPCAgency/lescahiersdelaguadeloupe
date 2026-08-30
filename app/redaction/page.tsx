import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { InstitutionalPageLayout } from '@/components/editorial/institutional-page-layout';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('site_pages')
    .select('seo_title, seo_description')
    .eq('slug', 'redaction')
    .maybeSingle();

  return {
    title: data?.seo_title ?? 'La rédaction',
    description: data?.seo_description ?? 'Présentation de la rédaction des Cahiers de la Guadeloupe.',
  };
}

export default async function RedactionPage() {
  const supabase = getSupabaseAdmin();
  const [{ data: page }, { data: authors }] = await Promise.all([
    supabase.from('site_pages').select('updated_at').eq('slug', 'redaction').maybeSingle(),
    supabase.from('authors').select('id, name, slug, bio, job_title, photo_path').eq('is_active', true).order('name'),
  ]);

  return (
    <>
      <InstitutionalPageLayout
        eyebrow="La rédaction"
        title="La rédaction"
        chapo="Les Cahiers de la Guadeloupe réunissent des auteurs, journalistes et contributeurs autour d'une même exigence : enquêter, comprendre, éclairer et débattre."
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'La rédaction', href: '/redaction' }]}
        updatedAt={page?.updated_at}
      >
        <div className="space-y-10">
          <section>
            <h2 className="font-display text-[22px] font-bold text-ink">Notre mission</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-text">
              Produire une information documentée, vérifiée et contextualisée sur la Guadeloupe.
              Nos enquêtes s'appuient sur des documents, des témoignages et des données publiques.
              Nous distinguons systématiquement les faits, les témoignages, les rapprochements et les hypothèses.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[22px] font-bold text-ink">Notre méthode</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-text">
              Notre travail suit quatre temps : enquêter, comprendre, éclairer, débattre.
              Nous confrontons les sources, identifions les zones d'ombre et présentons ce que les documents
              permettent ou non d'établir.{' '}
              <Link href="/notre-methode" className="font-medium text-primary hover:underline">
                En savoir plus sur notre méthode
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-[22px] font-bold text-ink">Notre indépendance éditoriale</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-text">
              Les Cahiers de la Guadeloupe sont une publication indépendante. La rédaction exerce son jugement
              éditorial sans ingérence. Les personnes citées ou mises en cause dans nos articles disposent d'un{' '}
              <Link href="/droit-de-reponse" className="font-medium text-primary hover:underline">
                droit de réponse
              </Link>
              .
            </p>
          </section>

          {authors && authors.length > 0 && (
            <section>
              <h2 className="font-display text-[22px] font-bold text-ink">Notre équipe</h2>
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {authors.map((author) => (
                  <div key={author.id} className="flex items-start gap-4 border-b border-border pb-6">
                    {author.photo_path && (
                      <Image
                        src={author.photo_path}
                        alt={author.name}
                        width={64}
                        height={64}
                        className="h-16 w-16 shrink-0 rounded-full object-cover grayscale"
                      />
                    )}
                    <div>
                      <h3 className="font-display text-[17px] font-semibold text-ink">{author.name}</h3>
                      {author.job_title && (
                        <p className="mt-0.5 text-[13px] font-medium text-primary">{author.job_title}</p>
                      )}
                      {author.bio && (
                        <p className="mt-2 text-[14px] leading-relaxed text-text">{author.bio}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="font-display text-[22px] font-bold text-ink">Nous contacter</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-text">
              Pour toute question, proposition de sujet ou information à transmettre,{' '}
              <Link href="/contact" className="font-medium text-primary hover:underline">
                contactez la rédaction
              </Link>
              .
            </p>
          </section>
        </div>
      </InstitutionalPageLayout>

      <section className="border-t border-ink bg-ink text-white">
        <div className="container-editorial py-10 text-center">
          <p className="text-[14px] font-semibold uppercase tracking-[0.32em] text-white/85 sm:text-[16px]">
            Enquêter • Comprendre • Éclairer • Débattre
          </p>
        </div>
      </section>
    </>
  );
}
