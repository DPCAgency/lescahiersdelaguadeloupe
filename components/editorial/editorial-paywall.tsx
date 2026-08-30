import Link from 'next/link';
import { Lock, ArrowRight } from 'lucide-react';

interface EditorialPaywallProps {
  issueNumber?: string;
  issuePrice?: string;
}

export function EditorialPaywall({ issueNumber, issuePrice }: EditorialPaywallProps) {
  return (
    <div className="my-10 border-t-2 border-primary pt-10">
      <div className="flex flex-col items-start gap-5 border border-border bg-background-soft p-6 sm:p-10">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <span className="eyebrow text-primary-dark">Pour continuer cette enquête</span>
        </div>
        <h3 className="article-title text-[24px] leading-[1.1] sm:text-[30px]">
          Cette enquête est réservée aux lecteurs des Cahiers.
        </h3>
        <p className="max-w-xl text-[15px] leading-relaxed text-text">
          Accédez à l'intégralité des chapitres, des documents et des sources. Choisissez la formule
          qui vous convient.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href="/abonnement" className="btn-editorial">
            S'abonner
            <ArrowRight className="h-4 w-4" />
          </Link>
          {issueNumber && issuePrice && (
            <Link
              href={`/les-cahiers/numero-02/acheter`}
              className="btn-editorial-outline"
            >
              Acheter ce Cahier · {issuePrice}
            </Link>
          )}
        </div>
        <div className="mt-2 border-t border-border pt-4">
          <p className="text-[13px] text-muted">
            Déjà abonné ?{' '}
            <Link href="/connexion" className="font-semibold text-primary hover:text-primary-dark">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
