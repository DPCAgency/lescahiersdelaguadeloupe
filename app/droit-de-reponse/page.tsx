import type { Metadata } from 'next';
import Link from 'next/link';
import { InstitutionalPageLayout } from '@/components/editorial/institutional-page-layout';
import { RightOfReplyForm } from '@/components/editorial/right-of-reply-form';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('site_pages')
    .select('seo_title, seo_description')
    .eq('slug', 'droit-de-reponse')
    .maybeSingle();

  return {
    title: data?.seo_title ?? 'Droit de réponse',
    description: data?.seo_description ?? 'Procédure de droit de réponse de la publication Les Cahiers de la Guadeloupe.',
  };
}

export default async function DroitDeReponsePage() {
  const supabase = getSupabaseAdmin();
  const { data: page } = await supabase
    .from('site_pages')
    .select('updated_at')
    .eq('slug', 'droit-de-reponse')
    .maybeSingle();

  return (
    <InstitutionalPageLayout
      eyebrow="La rédaction"
      title="Droit de réponse"
      chapo="Les Cahiers de la Guadeloupe accordent une attention particulière à l'exactitude des informations publiées et au respect des personnes citées ou mises en cause."
      breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Droit de réponse', href: '/droit-de-reponse' }]}
      updatedAt={page?.updated_at}
    >
      <div className="space-y-6">
        <h2 className="font-display text-[22px] font-bold text-ink">Comment procéder</h2>
        <p className="text-[16px] leading-relaxed text-text">
          Pour formuler une demande de droit de réponse ou de rectification, vous pouvez utiliser le formulaire ci-dessous.
          La rédaction examinera votre demande dans les meilleurs délais.
        </p>

        <ol className="space-y-3">
          {[
            'Identifiez l\'article concerné et fournissez son URL.',
            'Indiquez le passage ou le sujet qui pose problème.',
            'Précisez votre identité (nom, prénom, organisation le cas échéant).',
            'Expliquez précisément votre demande.',
            'Fournissez les éléments utiles permettant à la rédaction de l\'examiner.',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-[15px] text-text">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-white">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="border-t border-border pt-8">
        <h2 className="mb-6 font-display text-[22px] font-bold text-ink">Formulaire</h2>
        <RightOfReplyForm />
      </div>

      <div className="border-t border-border pt-6">
        <p className="text-[14px] text-muted">
          Vous pouvez également{' '}
          <Link href="/contact" className="font-medium text-primary hover:underline">
            contacter la rédaction
          </Link>{' '}
          pour toute autre demande.
        </p>
      </div>
    </InstitutionalPageLayout>
  );
}
