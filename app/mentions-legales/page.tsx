import type { Metadata } from 'next';
import Link from 'next/link';
import { InstitutionalPageLayout } from '@/components/editorial/institutional-page-layout';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('site_pages')
    .select('seo_title, seo_description')
    .eq('slug', 'mentions-legales')
    .maybeSingle();

  return {
    title: data?.seo_title ?? 'Mentions légales',
    description: data?.seo_description ?? 'Mentions légales de la publication Les Cahiers de la Guadeloupe.',
  };
}

export default async function MentionsLegalesPage() {
  const supabase = getSupabaseAdmin();
  const { data: page } = await supabase
    .from('site_pages')
    .select('updated_at')
    .eq('slug', 'mentions-legales')
    .maybeSingle();

  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value_json')
    .in('key', ['contact_email', 'site_name']);

  const settingsMap = new Map<string, string>(
    (settings ?? []).map((s) => [s.key, typeof s.value_json === 'string' ? s.value_json : String(s.value_json ?? '')])
  );

  const contactEmail = settingsMap.get('contact_email') || '';

  return (
    <InstitutionalPageLayout
      eyebrow="Informations"
      title="Mentions légales"
      breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Mentions légales', href: '/mentions-legales' }]}
      updatedAt={page?.updated_at}
    >
      <div className="space-y-10">
        <section>
          <h2 className="font-display text-[22px] font-bold text-ink">Éditeur du site</h2>
          <dl className="mt-4 space-y-3 text-[15px] text-text">
            <div>
              <dt className="font-medium text-ink">Nom de la publication</dt>
              <dd className="mt-0.5">Les Cahiers de la Guadeloupe</dd>
            </div>
            <div>
              <dt className="font-medium text-ink">Raison sociale</dt>
              <dd className="mt-0.5 text-muted">Information légale à compléter dans l'administration du site.</dd>
            </div>
            <div>
              <dt className="font-medium text-ink">Forme juridique</dt>
              <dd className="mt-0.5 text-muted">Information légale à compléter dans l'administration du site.</dd>
            </div>
            <div>
              <dt className="font-medium text-ink">Adresse du siège</dt>
              <dd className="mt-0.5 text-muted">Information légale à compléter dans l'administration du site.</dd>
            </div>
            <div>
              <dt className="font-medium text-ink">SIREN / SIRET</dt>
              <dd className="mt-0.5 text-muted">Information légale à compléter dans l'administration du site.</dd>
            </div>
            <div>
              <dt className="font-medium text-ink">Email</dt>
              <dd className="mt-0.5">{contactEmail || <span className="text-muted">À compléter dans les paramètres du site.</span>}</dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="font-display text-[22px] font-bold text-ink">Directeur de la publication</h2>
          <p className="mt-4 text-[15px] text-muted">Information légale à compléter dans l'administration du site.</p>
        </section>

        <section>
          <h2 className="font-display text-[22px] font-bold text-ink">Rédaction</h2>
          <p className="mt-4 text-[15px] text-text">
            Pour toute question éditoriale, vous pouvez{' '}
            <Link href="/contact" className="font-medium text-primary hover:underline">contacter la rédaction</Link>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-[22px] font-bold text-ink">Hébergement</h2>
          <dl className="mt-4 space-y-3 text-[15px] text-text">
            <div>
              <dt className="font-medium text-ink">Hébergeur</dt>
              <dd className="mt-0.5">Netlify</dd>
            </div>
            <div>
              <dt className="font-medium text-ink">Site internet</dt>
              <dd className="mt-0.5">
                <a href="https://www.netlify.com" className="text-primary hover:underline" rel="noopener noreferrer" target="_blank">
                  netlify.com
                </a>
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="font-display text-[22px] font-bold text-ink">Propriété intellectuelle</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-text">
            Les textes, articles, enquêtes, analyses, photographies, illustrations, logos et éléments graphiques
            publiés sur ce site sont protégés par les règles applicables en matière de propriété intellectuelle,
            sauf indication contraire. Toute reproduction, représentation, modification, publication ou adaptation,
            totale ou partielle, des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite
            sans autorisation écrite préalable.
          </p>
        </section>

        <section>
          <h2 className="font-display text-[22px] font-bold text-ink">Responsabilité</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-text">
            La rédaction veille à l'exactitude des informations publiées. Certaines informations peuvent toutefois
            évoluer après publication. Le site ne saurait être tenu responsable d'éventuelles erreurs ou omissions,
            ni des dommages directs ou indirects résultant de l'utilisation des informations diffusées.
          </p>
        </section>

        <section>
          <h2 className="font-display text-[22px] font-bold text-ink">Liens externes</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-text">
            Ce site peut contenir des liens vers des sites tiers. Les Cahiers de la Guadeloupe n'exercent aucun
            contrôle sur le contenu de ces sites et déclinent toute responsabilité quant aux informations qui y
            sont diffusées.
          </p>
        </section>
      </div>
    </InstitutionalPageLayout>
  );
}
