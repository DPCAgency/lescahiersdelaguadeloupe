'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Loader2, Clock, CheckCircle, XCircle, Archive, ExternalLink } from 'lucide-react';

interface RightOfReplyRequest {
  id: string;
  name: string;
  first_name: string | null;
  organization: string | null;
  position: string | null;
  email: string;
  phone: string | null;
  article_url: string;
  subject: string;
  message: string;
  certified: boolean;
  status: string;
  created_at: string;
  processed_at: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Nouveau',
  in_review: 'En examen',
  processed: 'Traité',
  rejected: 'Rejeté',
  archived: 'Archivé',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-primary/10 text-primary',
  in_review: 'bg-amber-50 text-amber-700',
  processed: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  archived: 'bg-neutral-100 text-neutral-500',
};

export default function AdminDroitsDeReponsePage() {
  const [requests, setRequests] = useState<RightOfReplyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<RightOfReplyRequest | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('right_of_reply_requests').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query;
    setRequests(data ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    const updates: Record<string, unknown> = { status };
    if (['processed', 'rejected', 'archived'].includes(status)) updates.processed_at = new Date().toISOString();
    await supabase.from('right_of_reply_requests').update(updates).eq('id', id);
    await load();
    setSelected(null);
  };

  const counts = {
    all: requests.length,
    new: requests.filter((r) => r.status === 'new').length,
    in_review: requests.filter((r) => r.status === 'in_review').length,
    processed: requests.filter((r) => r.status === 'processed').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
    archived: requests.filter((r) => r.status === 'archived').length,
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-neutral-800">Droits de réponse</h2>
        <p className="mt-1 text-sm text-neutral-500">Demandes reçues via le formulaire de droit de réponse.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(counts).map(([key, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === key ? 'border-ink bg-ink text-white' : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            {STATUS_LABELS[key] ?? 'Tous'}
            <span className={`rounded-full px-1.5 text-xs ${filter === key ? 'bg-white/20' : 'bg-neutral-100'}`}>{count}</span>
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Demandeur</th>
              <th className="px-4 py-3">Article</th>
              <th className="px-4 py-3">Objet</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {requests.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-400">Aucune demande.</td></tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 text-sm text-neutral-500">{new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 text-sm font-medium text-neutral-800">{r.name}{r.first_name ? ` ${r.first_name}` : ''}{r.organization ? ` (${r.organization})` : ''}</td>
                  <td className="px-4 py-3 text-sm text-neutral-600 max-w-[200px] truncate">{r.article_url}</td>
                  <td className="px-4 py-3 text-sm text-neutral-600 max-w-[200px] truncate">{r.subject}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status] ?? ''}`}>{STATUS_LABELS[r.status] ?? r.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(r)} className="text-sm text-primary hover:underline">Voir</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-neutral-800">{selected.name}{selected.first_name ? ` ${selected.first_name}` : ''}</h3>
                {selected.organization && <p className="mt-0.5 text-sm text-neutral-500">{selected.organization}{selected.position ? ` · ${selected.position}` : ''}</p>}
                <p className="mt-1 text-sm text-neutral-500">{selected.email}{selected.phone ? ` · ${selected.phone}` : ''}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[selected.status] ?? ''}`}>{STATUS_LABELS[selected.status] ?? selected.status}</span>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Article concerné</p>
                <a href={selected.article_url} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1 text-sm text-primary hover:underline">
                  {selected.article_url} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Objet</p>
                <p className="mt-1 text-sm text-neutral-700">{selected.subject}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Message</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{selected.message}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                {selected.certified ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />}
                {selected.certified ? 'Certifié exact par le demandeur' : 'Non certifié'}
              </div>
              <p className="text-xs text-neutral-400">Reçu le {new Date(selected.created_at).toLocaleString('fr-FR')}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
              {selected.status !== 'in_review' && (
                <button onClick={() => updateStatus(selected.id, 'in_review')} className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-amber-50">
                  <Clock className="h-3.5 w-3.5" /> En examen
                </button>
              )}
              {selected.status !== 'processed' && (
                <button onClick={() => updateStatus(selected.id, 'processed')} className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-green-50">
                  <CheckCircle className="h-3.5 w-3.5" /> Traité
                </button>
              )}
              {selected.status !== 'rejected' && (
                <button onClick={() => updateStatus(selected.id, 'rejected')} className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-red-50">
                  <XCircle className="h-3.5 w-3.5" /> Rejeter
                </button>
              )}
              {selected.status !== 'archived' && (
                <button onClick={() => updateStatus(selected.id, 'archived')} className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100">
                  <Archive className="h-3.5 w-3.5" /> Archiver
                </button>
              )}
              <button onClick={() => setSelected(null)} className="ml-auto rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-500 hover:bg-neutral-100">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
