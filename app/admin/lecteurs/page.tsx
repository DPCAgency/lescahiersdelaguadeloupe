import { supabaseAdmin } from '@/lib/supabase/server';
import { Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminLecteursPage() {
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, first_name, last_name, display_name, role, status, created_at')
    .order('created_at', { ascending: false });

  const roleColors: Record<string, string> = {
    reader: 'bg-neutral-100 text-neutral-600',
    editor: 'bg-blue-100 text-blue-700',
    admin: 'bg-amber-100 text-amber-700',
    super_admin: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-neutral-800">Lecteurs</h2>
        <p className="mt-1 text-sm text-neutral-500">Comptes enregistrés sur le site.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Nom</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Rôle</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Statut</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Inscrit le</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(!profiles || profiles.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center">
                  <Users className="mx-auto h-8 w-8 text-neutral-300" strokeWidth={1.5} />
                  <p className="mt-2 text-sm text-neutral-400">Aucun lecteur enregistré.</p>
                </td>
              </tr>
            )}
            {profiles?.map((profile) => (
              <tr key={profile.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 text-sm font-medium text-neutral-800">
                  {profile.display_name || `${profile.first_name} ${profile.last_name}`.trim() || 'Sans nom'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[profile.role] ?? ''}`}>
                    {profile.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-500">{profile.status}</td>
                <td className="px-4 py-3 text-sm text-neutral-400">
                  {new Date(profile.created_at).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
