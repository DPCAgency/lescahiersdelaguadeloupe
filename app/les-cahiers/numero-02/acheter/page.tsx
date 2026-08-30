'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function AcheterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [price, setPrice] = useState(2.90);
  const [stripeConfigured, setStripeConfigured] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/connexion?redirect=/les-cahiers/numero-02/acheter');
        return;
      }
      setUserId(session.user.id);

      const { data: issue } = await supabase
        .from('issues')
        .select('id, full_download_price')
        .eq('slug', 'numero-02')
        .eq('status', 'published')
        .maybeSingle();

      if (!issue) {
        setError('Cahier introuvable.');
        setLoading(false);
        return;
      }
      setPrice(Number(issue.full_download_price));

      const { data: product } = await supabase
        .from('products')
        .select('id, price')
        .eq('resource_id', issue.id)
        .eq('type', 'issue')
        .eq('is_active', true)
        .maybeSingle();

      if (product) {
        setProductId(product.id);
        setPrice(Number(product.price));
      }

      const { data: entitlement } = await supabase
        .from('entitlements')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('resource_id', issue.id)
        .eq('resource_type', 'issue_full')
        .maybeSingle();

      if (entitlement) {
        router.push('/les-cahiers/numero-02/lire');
        return;
      }

      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBuy = async () => {
    if (!userId || !productId) return;
    setRedirecting(true);
    setError(null);

    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          userId,
          productId,
          successUrl: `${window.location.origin}/achat-confirme`,
          cancelUrl: `${window.location.origin}/les-cahiers/numero-02`,
        }),
      });

      const data = await resp.json() as { checkoutUrl?: string; error?: string; configured?: boolean };

      if (!data.configured) {
        setStripeConfigured(false);
        setRedirecting(false);
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.error ?? 'Erreur lors de la création du paiement.');
        setRedirecting(false);
      }
    } catch {
      setError('Erreur de connexion au service de paiement.');
      setRedirecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="container-narrow py-16">
      <div className="max-w-md border border-border bg-background p-8">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <span className="eyebrow text-primary-dark">Achat du Cahier</span>
        </div>
        <h1 className="article-title mt-4 text-[24px] leading-[1.1]">
          Cahier N°02 · Qui gouverne réellement Le Gosier ?
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-text">
          Accès complet aux 11 pages du Cahier + téléchargement PDF.
        </p>

        <div className="mt-6 border-t border-border pt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-medium text-muted">Prix</span>
            <span className="font-display text-[32px] font-bold text-primary">
              {price.toFixed(2)} €
            </span>
          </div>
        </div>

        <button
          onClick={handleBuy}
          disabled={redirecting || !stripeConfigured}
          className="btn-editorial mt-6 w-full"
        >
          {redirecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirection vers le paiement...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Acheter · {price.toFixed(2)} €
            </>
          )}
        </button>

        {!stripeConfigured && (
          <div className="mt-4 flex items-center gap-2 border border-amber-200 bg-amber-50 p-3">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <p className="text-[12px] text-amber-700">
              Stripe n'est pas encore configuré. Le paiement sera disponible prochainement.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 border border-red-200 bg-red-50 p-3">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-[12px] text-red-700">{error}</p>
          </div>
        )}

        <p className="mt-4 text-center text-[11px] text-muted">
          Paiement sécurisé via Stripe. Vous recevrez un accès immédiat après confirmation.
        </p>
      </div>
    </div>
  );
}
