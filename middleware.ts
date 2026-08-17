import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_ROLES = new Set(['editor', 'admin', 'super_admin']);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith('/admin')) {
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
      if (meData.id && meData.role && ADMIN_ROLES.has(meData.role) && meData.status === 'active') {
        return NextResponse.next();
      }
    }
  } catch {
    // fetch failed
  }

  const response = NextResponse.redirect(new URL(`/connexion?redirect=${encodeURIComponent(pathname)}`, req.url));
  response.cookies.delete('sb-access-token');
  response.cookies.delete('sb-refresh-token');
  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
