'use client';

import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';

interface MonProfilClientProps {
  profile: Record<string, unknown> | null;
  author: Record<string, unknown> | null;
}

export function MonProfilClient({ profile, author }: MonProfilClientProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState((profile?.display_name as string) ?? '');
  const [avatarUrl, setAvatarUrl] = useState((profile?.avatar_url as string) ?? '');

  const [bio, setBio] = useState((author?.bio as string) ?? '');
  const [jobTitle, setJobTitle] = useState((author?.job_title as string) ?? '');
  const [photoPath, setPhotoPath] = useState((author?.photo_path as string) ?? '');
  const [emailPublic, setEmailPublic] = useState((author?.email_public as string) ?? '');

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      // Update profile
      const profileResp = await fetch('/api/admin/mon-profil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ display_name: displayName, avatar_url: avatarUrl }),
      });
      if (!profileResp.ok) throw new Error('Échec de la sauvegarde du profil');

      // Update author if exists
      if (author?.id) {
        const authorResp = await fetch(`/api/admin/auteurs/${author.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ bio, job_title: jobTitle, photo_path: photoPath, email_public: emailPublic }),
        });
        if (!authorResp.ok) throw new Error('Échec de la sauvegarde de la fiche auteur');
      }

      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
    setSaving(false);
  };

  const role = (profile?.role as string) ?? 'reader';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-neutral-800">Mon profil</h2>
        <p className="mt-1 text-sm text-neutral-500">Vos informations éditoriales.</p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-5">
        <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-neutral-600">Informations personnelles</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Nom affiché</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Photo (URL)</label>
            <input type="text" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" placeholder="/assets/..." />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Rôle</label>
            <input type="text" value={role} disabled className="w-full rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-sm text-neutral-400" />
          </div>
        </div>
      </div>

      {author && (
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-neutral-600">Fiche auteur publique</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Fonction</label>
              <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Biographie</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Photo publique (URL)</label>
              <input type="text" value={photoPath} onChange={(e) => setPhotoPath(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" placeholder="/assets/..." />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Email public</label>
              <input type="text" value={emailPublic} onChange={(e) => setEmailPublic(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer
        </button>
        {saved && <span className="text-xs text-green-500">✓ Enregistré</span>}
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  );
}
