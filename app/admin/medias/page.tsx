'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Loader2, Upload, Search, Trash2, ImageIcon } from 'lucide-react';

interface MediaItem {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  metadata: { size?: number; mimetype?: string };
}

const buckets = [
  { id: 'site-public', label: 'Site public' },
  { id: 'article-images', label: 'Images d\'articles' },
  { id: 'covers', label: 'Couvertures' },
  { id: 'issues-private', label: 'Cahiers (privé)' },
  { id: 'issue-pages-private', label: 'Pages de cahiers (privé)' },
  { id: 'documents-private', label: 'Documents (privé)' },
  { id: 'imports-private', label: 'Imports (privé)' },
];

export default function AdminMediasPage() {
  const [bucket, setBucket] = useState('site-public');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');

  const loadMedia = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from(bucket).list('', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error) {
      console.error('Error loading media:', error);
    }
    setMedia((data ?? []) as MediaItem[]);
    setLoading(false);
  }, [bucket]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) {
      alert(`Erreur d'upload: ${error.message}`);
    } else {
      await loadMedia();
    }
    setUploading(false);
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Supprimer "${name}" ?`)) return;
    const { error } = await supabase.storage.from(bucket).remove([name]);
    if (error) {
      alert(`Erreur: ${error.message}`);
    } else {
      await loadMedia();
    }
  };

  const getPublicUrl = (name: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(name);
    return data.publicUrl;
  };

  const filtered = media.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const isImage = (m: MediaItem) => {
    const mime = m.metadata?.mimetype ?? '';
    return mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(m.name);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-neutral-800">Médiathèque</h2>
        <p className="mt-1 text-sm text-neutral-500">Gérez les images, couvertures et documents.</p>
      </div>

      {/* Bucket selector + Upload */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={bucket}
          onChange={(e) => setBucket(e.target.value)}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
        >
          {buckets.map((b) => (
            <option key={b.id} value={b.id}>{b.label}</option>
          ))}
        </select>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'Upload…' : 'Uploader'}
          <input type="file" onChange={handleUpload} className="hidden" />
        </label>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-10 pr-3 text-sm"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white py-12 text-center">
          <ImageIcon className="mx-auto h-8 w-8 text-neutral-300" strokeWidth={1.5} />
          <p className="mt-2 text-sm text-neutral-400">Aucun fichier dans ce bucket.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-lg border border-neutral-200 bg-white p-3">
              <div className="aspect-square overflow-hidden rounded bg-neutral-50">
                {isImage(item) ? (
                  <img src={getPublicUrl(item.name)} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-neutral-300" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <p className="mt-2 truncate text-xs font-medium text-neutral-600" title={item.name}>{item.name}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] text-neutral-400">
                  {item.metadata?.size ? `${(item.metadata.size / 1024).toFixed(0)} Ko` : ''}
                </span>
                <button onClick={() => handleDelete(item.name)} className="rounded p-1 text-red-400 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
