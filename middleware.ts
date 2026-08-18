import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_ROLES = new Set(['editor', 'admin', 'super_admin']);

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

      // Check status if profile exists
      if (meData.status && meData.status !== 'active') {
        return redirectToLogin(req, pathname);
      }

      // Admin routes require admin role
      if (isAdmin && (!meData.role || !ADMIN_ROLES.has(meData.role))) {
        // Reader trying to access admin — send to mon-compte
        return NextResponse.redirect(new URL('/mon-compte', req.url));
      }

      // mon-compte routes: any authenticated active user is allowed
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
