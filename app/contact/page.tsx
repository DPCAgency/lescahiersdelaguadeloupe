import type { Metadata } from 'next';
import Link from 'next/link';
import { InstitutionalPageLayout } from '@/components/editorial/institutional-page-layout';
import { ContactForm } from '@/components/editorial/contact-form';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('site_pages')
    .select('seo_title, seo_description')
    .eq('slug', 'contact')
    .maybeSingle();

  return {
    title: data?.seo_title ?? 'Contacter la rédaction',
    description: data?.seo_description ?? 'Contacter la rédaction des Cahiers de la Guadeloupe.',
  };
}

export default async function ContactPage() {
  const supabase = getSupabaseAdmin();
  const { data: page } = await supabase
    .from('site_pages')
    .select('updated_at')
    .eq('slug', 'contact')
    .maybeSingle();

  return (
    <InstitutionalPageLayout
      eyebrow="La rédaction"
      title="Contacter la rédaction"
      chapo="Une information à transmettre, une question sur un article, une proposition de sujet ou une demande professionnelle ? Vous pouvez contacter la rédaction à l'aide du formulaire ci-dessous."
      breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Contact', href: '/contact' }]}
      updatedAt={page?.updated_at}
    >
      <ContactForm />

      <div className="mt-8 border-t border-border pt-6">
        <p className="text-[14px] text-muted">
          Pour une demande de droit de réponse,{' '}
          <Link href="/droit-de-reponse" className="font-medium text-primary hover:underline">
            utilisez le formulaire dédié
          </Link>
          .
        </p>
      </div>
    </InstitutionalPageLayout>
  );
}
