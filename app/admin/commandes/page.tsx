import { supabaseAdmin } from '@/lib/supabase/server';
import { ShoppingCart } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminCommandesPage() {
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id, user_id, status, total_amount, currency, payment_provider, created_at')
    .order('created_at', { ascending: false });

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    paid: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    refunded: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-neutral-100 text-neutral-500',
  };

  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    paid: 'Payé',
    failed: 'Échoué',
    refunded: 'Remboursé',
    cancelled: 'Annulé',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-neutral-800">Commandes</h2>
        <p className="mt-1 text-sm text-neutral-500">Historique des commandes. Le paiement n'est pas encore activé.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Utilisateur</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Statut</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Montant</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Paiement</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <ShoppingCart className="mx-auto h-8 w-8 text-neutral-300" strokeWidth={1.5} />
                  <p className="mt-2 text-sm text-neutral-400">Aucune commande pour le moment.</p>
                  <p className="mt-1 text-xs text-neutral-300">Les commandes apparaîtront ici une fois Stripe connecté.</p>
                </td>
              </tr>
            )}
            {orders?.map((order) => (
              <tr key={order.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 text-xs font-mono text-neutral-400">{order.id.slice(0, 8)}…</td>
                <td className="px-4 py-3 text-xs font-mono text-neutral-400">{order.user_id.slice(0, 8)}…</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[order.status] ?? ''}`}>
                    {statusLabels[order.status] ?? order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-600">{order.total_amount} {order.currency}</td>
                <td className="px-4 py-3 text-sm text-neutral-400">{order.payment_provider ?? '·'}</td>
                <td className="px-4 py-3 text-sm text-neutral-400">{new Date(order.created_at).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
