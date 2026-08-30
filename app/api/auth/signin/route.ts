import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sanitizeRedirect } from '@/lib/auth/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_ROLES = new Set(['editor', 'admin', 'super_admin']);

function createSessionResponse(req: NextRequest, accessToken: string, refreshToken: string, expiresIn: number, redirectPath: string): NextResponse {
  const response = NextResponse.redirect(new URL(redirectPath, req.url), { status: 303 });
  response.cookies.set('sb-access-token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: expiresIn,
  });
  response.cookies.set('sb-refresh-token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const redirectParam = formData.get('redirect') as string | null;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: 'Configuration serveur incomplète' }, { status: 500 });
    }

    const client = createClient(supabaseUrl, anonKey);
    const { data, error } = await client.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    // Fetch profile to determine role
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile } = await userClient
      .from('profiles')
      .select('role, status')
      .eq('id', data.user.id)
      .maybeSingle();

    // Determine redirect target
    const safeRedirect = sanitizeRedirect(redirectParam);

    // If user is admin and redirect is to admin area, send them there
    // If user is admin but no admin redirect, send to /mon-compte (they can navigate to admin)
    // If user is reader, always send to safeRedirect (which defaults to /mon-compte)
    let finalRedirect = safeRedirect;

    if (profile && profile.status !== 'active') {
      // Inactive account — sign out and reject
      await client.auth.signOut();
      return NextResponse.json({ error: 'Compte désactivé. Contactez l\'administrateur.' }, { status: 403 });
    }

    // If the redirect target is an admin path but user is not admin, send to /mon-compte
    if (safeRedirect.startsWith('/admin') && (!profile || !ADMIN_ROLES.has(profile.role))) {
      finalRedirect = '/mon-compte';
    }

    return createSessionResponse(req, data.session.access_token, data.session.refresh_token, data.session.expires_in, finalRedirect);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[signin] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
