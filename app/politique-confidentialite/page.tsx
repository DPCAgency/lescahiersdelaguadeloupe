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
    .eq('slug', 'politique-confidentialite')
    .maybeSingle();

  return {
    title: data?.seo_title ?? 'Politique de confidentialité',
    description: data?.seo_description ?? 'Politique de confidentialité de la publication Les Cahiers de la Guadeloupe.',
  };
}

export default async function PolitiqueConfidentialitePage() {
  const supabase = getSupabaseAdmin();
  const { data: page } = await supabase
    .from('site_pages')
    .select('updated_at')
    .eq('slug', 'politique-confidentialite')
    .maybeSingle();

  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value_json')
    .in('key', ['contact_email']);

  const contactEmail = settings?.[0]
    ? typeof settings[0].value_json === 'string'
      ? settings[0].value_json
      : String(settings[0].value_json ?? '')
    : '';

  const sections = [
    {
      title: '1. Responsable du traitement',
      body: 'Le responsable du traitement des données est Les Cahiers de la Guadeloupe. Pour toute question relative à la protection des données, vous pouvez contacter la rédaction via le formulaire de contact.',
    },
    {
      title: '2. Données susceptibles d\'être collectées',
      body: 'Le site peut collecter les données suivantes : nom, prénom, adresse email, et le contenu des messages envoyés via les formulaires de contact et de droit de réponse. Lors de la création d\'un compte, des données d\'identification (email, mot de passe chiffré) sont également collectées.',
    },
    {
      title: '3. Finalités',
      body: 'Les données collectées servent à : répondre aux demandes envoyées via les formulaires, gérer les comptes utilisateurs, traiter les commandes et abonnements, et assurer le fonctionnement technique du site.',
    },
    {
      title: '4. Base juridique',
      body: 'Le traitement des données repose sur le consentement de l\'utilisateur (inscription, formulaires) et sur l\'exécution contractuelle (commandes, abonnements).',
    },
    {
      title: '5. Durée de conservation',
      body: 'Les données sont conservées le temps nécessaire à la finalité du traitement. Les demandes de contact et de droit de réponse sont conservées pendant la durée nécessaire à leur traitement, puis archivées. Les comptes utilisateurs sont conservés tant que l\'utilisateur maintient son inscription.',
    },
    {
      title: '6. Destinataires',
      body: 'Les données sont destinées à la rédaction des Cahiers de la Guadeloupe et à l\'équipe technique chargée du fonctionnement du site. Elles ne sont pas vendues ni cédées à des tiers à des fins commerciales.',
    },
    {
      title: '7. Prestataires techniques',
      body: 'Le site s\'appuie sur des prestataires techniques pour l\'hébergement (Netlify) et la gestion de la base de données (Supabase). Ces prestataires agissent en qualité de sous-traitants et sont soumis à des obligations de confidentialité.',
    },
    {
      title: '8. Cookies',
      body: 'Le site utilise des cookies techniques strictement nécessaires à son fonctionnement (session d\'authentification, préférences de lecture). Le site n\'utilise pas de cookies de suivi publicitaire ni de traceurs marketing. Aucun outil d\'analyse d\'audience n\'est activé actuellement.',
    },
    {
      title: '9. Droits des personnes',
      body: 'Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants : droit d\'accès, de rectification, d\'effacement, de limitation, d\'opposition, et de portabilité lorsque applicable.',
    },
    {
      title: '10. Exercice des droits',
      body: `Pour exercer vos droits, vous pouvez contacter la rédaction via le formulaire de contact ou par email${contactEmail ? ` à l'adresse ${contactEmail}` : ''}. Vous pouvez également introduire une réclamation auprès de l'autorité de contrôle compétente (CNIL en France).`,
    },
    {
      title: '11. Sécurité',
      body: 'Le site met en œuvre des mesures techniques et organisationnelles pour protéger les données contre les accès non autorisés, les altérations ou les fuites. Les mots de passe sont chiffrés et ne sont jamais stockés en clair.',
    },
    {
      title: '12. Modification de la politique',
      body: 'Cette politique de confidentialité peut être mise à jour. La date de dernière mise à jour est indiquée en bas de page.',
    },
    {
      title: '13. Contact',
      body: (
        <>
          Pour toute question relative à vos données personnelles,{' '}
          <Link href="/contact" className="font-medium text-primary hover:underline">contactez la rédaction</Link>
          .
        </>
      ),
    },
  ];

  return (
    <InstitutionalPageLayout
      eyebrow="Informations"
      title="Politique de confidentialité"
      breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Politique de confidentialité', href: '/politique-confidentialite' }]}
      updatedAt={page?.updated_at}
    >
      <div className="space-y-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="font-display text-[20px] font-bold text-ink">{s.title}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-text">{s.body}</p>
          </section>
        ))}
      </div>
    </InstitutionalPageLayout>
  );
}
