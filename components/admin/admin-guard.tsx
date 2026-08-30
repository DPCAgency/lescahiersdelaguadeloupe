'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AdminGuardProps {
  children: ReactNode;
}

const EDITORIAL_ROLES = new Set(['author', 'editor', 'admin', 'super_admin']);

const ADMIN_ONLY_ROUTES = [
  '/admin/settings',
  '/admin/navigation',
  '/admin/seo',
  '/admin/auteurs',
  '/admin/lecteurs',
  '/admin/commandes',
  '/admin/territoires',
  '/admin/rubriques',
  '/admin/pages',
  '/admin/homepage',
  '/admin/import',
];

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

        if (data.id && data.role && EDITORIAL_ROLES.has(data.role) && data.status === 'active') {
          // Author role: check route access
          if (data.role === 'author') {
            // Allow cahier edit/preview for assigned issues (API checks actual permission)
            if (pathname.startsWith('/admin/cahiers/') && (pathname.endsWith('/edit') || pathname.endsWith('/preview'))) {
              setStatus('authorized');
              return;
            }
            // Allow mes-cahiers
            if (pathname === '/admin/mes-cahiers' || pathname.startsWith('/admin/mes-cahiers/')) {
              setStatus('authorized');
              return;
            }
            const isRestricted = ADMIN_ONLY_ROUTES.some(
              (route) => pathname === route || pathname.startsWith(route + '/'),
            );
            if (isRestricted) {
              router.replace('/admin/dashboard');
              return;
            }
          }
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
