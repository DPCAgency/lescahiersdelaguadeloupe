import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const firstname = formData.get('firstname') as string;
    const lastname = formData.get('lastname') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password || !firstname || !lastname) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Configuration serveur incomplète' }, { status: 500 });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstname,
        last_name: lastname,
      },
    });

    if (authError) {
      const message = authError.message.includes('already')
        ? 'Un compte existe déjà avec cet email'
        : authError.message;
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const userId = authData.user.id;

    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: userId,
        first_name: firstname,
        last_name: lastname,
        display_name: `${firstname} ${lastname}`,
        role: 'reader',
        status: 'active',
      });

    if (profileError) {
      console.error('Profile creation failed:', profileError.message);
    }

    const clientKey = anonKey || serviceKey;
    const userClient = createClient(supabaseUrl, clientKey);

    const { data: sessionData, error: sessionError } = await userClient.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionError || !sessionData.session) {
      return NextResponse.redirect(new URL('/connexion?registered=1', req.url));
    }

    const response = NextResponse.redirect(new URL('/mon-compte', req.url));
    response.cookies.set('sb-access-token', sessionData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: sessionData.session.expires_in,
    });
    response.cookies.set('sb-refresh-token', sessionData.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[signup] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
