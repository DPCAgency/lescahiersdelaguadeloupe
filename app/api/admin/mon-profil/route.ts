import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getEditorialUser } from '@/lib/permissions/editorial';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function editorialClient(token: string) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getEditorialUser(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await req.json() as { display_name?: string; avatar_url?: string };
  const token = req.cookies.get('sb-access-token')!.value;
  const client = editorialClient(token);

  const update: Record<string, unknown> = {};
  if (body.display_name !== undefined) update.display_name = body.display_name;
  if (body.avatar_url !== undefined) update.avatar_url = body.avatar_url;

  // Users can only update their own profile (RLS enforces this too)
  const { error } = await client
    .from('profiles')
    .update(update)
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
