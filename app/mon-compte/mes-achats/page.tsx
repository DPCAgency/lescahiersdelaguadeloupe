'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, FileText, Download, Eye, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils/format';

interface Purchase {
  id: string;
  status: string;
  total_amount: string;
  currency: string;
  created_at: string;
  resource_id: string;
  resource_type: string;
  issue_title?: string;
  issue_number?: string;
  issue_slug?: string;
}

export default function MesAchatsPage() {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        window.location.href = '/connexion?redirect=/mon-compte/mes-achats';
        return;
      }

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, status, total_amount, currency, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        setError('Erreur lors du chargement des achats.');
        setLoading(false);
        return;
      }

      const purchases: Purchase[] = [];

      for (const order of orders ?? []) {
        const { data: items } = await supabase
          .from('order_items')
          .select('resource_type, resource_id')
          .eq('order_id', order.id);

        for (const item of items ?? []) {
          if (item.resource_type === 'issue') {
            const { data: issue } = await supabase
              .from('issues')
              .select('title, issue_number, slug')
              .eq('id', item.resource_id)
              .maybeSingle();

            purchases.push({
              id: order.id,
              status: order.status,
              total_amount: order.total_amount,
              currency: order.currency,
              created_at: order.created_at,
              resource_id: item.resource_id,
              resource_type: item.resource_type,
              issue_title: issue?.title,
              issue_number: issue?.issue_number,
              issue_slug: issue?.slug,
            });
          }
        }
      }

      setPurchases(purchases);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="container-editorial py-12">
      <h1 className="display-title text-[32px] sm:text-[40px]">Mes achats</h1>

      {error && (
        <div className="mt-6 flex items-center gap-2 border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <p className="text-[13px] text-red-700">{error}</p>
        </div>
      )}

      {purchases.length === 0 ? (
        <div className="mt-8 border border-border bg-background-soft p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-4 text-[15px] text-text">Vous n'avez pas encore acheté de Cahier.</p>
          <Link href="/les-cahiers/numero-02" className="btn-editorial mt-6 inline-flex">
            Découvrir le Cahier N°02
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-col">
          {purchases.map((p) => (
            <div key={p.id} className="border-t border-border py-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-center">
                <div className="sm:col-span-6">
                  <h3 className="article-title text-[18px]">
                    {p.issue_title ?? 'Cahier'}
                  </h3>
                  {p.issue_number && (
                    <p className="mt-1 text-[13px] text-muted">
                      Cahier N°{p.issue_number}
                    </p>
                  )}
                  <p className="mt-1 text-[12px] text-muted">
                    {new Date(p.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <span className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${
                    p.status === 'paid' ? 'text-primary' : 'text-muted'
                  }`}>
                    {p.status === 'paid' ? 'Payé' : p.status === 'pending' ? 'En attente' : p.status}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="font-display text-[18px] font-bold text-ink">
                    {formatPrice(Number(p.total_amount))}
                  </span>
                </div>
                <div className="flex gap-2 sm:col-span-2 sm:justify-end">
                  {p.status === 'paid' && p.issue_slug && (
                    <>
                      <Link
                        href={`/les-cahiers/${p.issue_slug}/lire`}
                        className="inline-flex items-center gap-1.5 border border-ink px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-white"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Lire
                      </Link>
                      <a
                        href={`/api/issues/${p.resource_id}/download`}
                        className="inline-flex items-center gap-1.5 border border-primary px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary transition-colors hover:bg-primary hover:text-white"
                      >
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
