'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AdminGuardProps {
  children: ReactNode;
}

const ADMIN_ROLES = new Set(['editor', 'admin', 'super_admin']);

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/auth/me', { credentials: 'same-origin' });
        if (!resp.ok) {
          setStatus('unauthorized');
          router.replace(`/connexion?redirect=${encodeURIComponent(pathname)}`);
          return;
        }

        const data = await resp.json() as { id?: string; role?: string; status?: string };

        if (data.id && data.role && ADMIN_ROLES.has(data.role) && data.status === 'active') {
          setStatus('authorized');
        } else {
          setStatus('unauthorized');
          router.replace('/');
        }
      } catch {
        setStatus('unauthorized');
        router.replace(`/connexion?redirect=${encodeURIComponent(pathname)}`);
      }
    })();
  }, [router, pathname]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <p className="text-sm uppercase tracking-[0.2em] text-white/60">Vérification des accès…</p>
      </div>
    );
  }

  if (status === 'unauthorized') return null;

  return <>{children}</>;
}
