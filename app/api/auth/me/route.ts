import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRequiredServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: 'Configuration incomplète' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.cookies.get('sb-access-token')?.value || null;

  if (!token) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const client = createClient(supabaseUrl, anonKey);
    const { data: userData } = await client.auth.getUser(token);

    if (!userData?.user?.id) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const userId = userData.user.id;

    const admin = getRequiredServiceRoleClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('role, display_name, status')
      .eq('id', userId)
      .maybeSingle();

    if (profile) {
      return NextResponse.json({
        id: userId,
        role: profile.role,
        display_name: profile.display_name,
        status: profile.status,
      });
    }

    return NextResponse.json({ id: userId });
  } catch {
    return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
  }
}
