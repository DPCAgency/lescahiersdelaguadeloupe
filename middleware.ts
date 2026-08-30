import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const EDITORIAL_ROLES = new Set(['author', 'editor', 'admin', 'super_admin']);

// Routes that only editor/admin/super_admin can access
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
  '/admin/medias',
  '/admin/cahiers',
];

// Routes that authors CAN access
const AUTHOR_ALLOWED_ROUTES = [
  '/admin/dashboard',
  '/admin/mes-articles',
  '/admin/articles',
  '/admin/mon-profil',
  '/admin/aide',
];

function isAdminOnlyRoute(pathname: string): boolean {
  return ADMIN_ONLY_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdmin = pathname.startsWith('/admin');
  const isMonCompte = pathname.startsWith('/mon-compte');

  if (!isAdmin && !isMonCompte) {
    return NextResponse.next();
  }

  const token = req.cookies.get('sb-access-token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL(`/connexion?redirect=${encodeURIComponent(pathname)}`, req.url));
  }

  try {
    const resp = await fetch(new URL('/api/auth/me', req.url), {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (resp.ok) {
      const meData = await resp.json() as { id?: string; role?: string; status?: string };

      if (!meData.id) {
        return redirectToLogin(req, pathname);
      }

      if (meData.status && meData.status !== 'active') {
        return redirectToLogin(req, pathname);
      }

      if (isAdmin) {
        // Must have an editorial role
        if (!meData.role || !EDITORIAL_ROLES.has(meData.role)) {
          return NextResponse.redirect(new URL('/mon-compte', req.url));
        }

        // Authors: restrict to allowed routes only
        if (meData.role === 'author' && isAdminOnlyRoute(pathname)) {
          return NextResponse.redirect(new URL('/admin/dashboard', req.url));
        }
      }

      return NextResponse.next();
    }
  } catch {
    // fetch failed
  }

  return redirectToLogin(req, pathname);
}

function redirectToLogin(req: NextRequest, pathname: string) {
  const response = NextResponse.redirect(new URL(`/connexion?redirect=${encodeURIComponent(pathname)}`, req.url));
  response.cookies.delete('sb-access-token');
  response.cookies.delete('sb-refresh-token');
  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/mon-compte/:path*'],
};
