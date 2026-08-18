import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function adminClient(token: string) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(req: NextRequest, { params }: { params: { articleId: string } }) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await req.json() as { scheduled_at?: string };
  const scheduledAt = body.scheduled_at;

  if (!scheduledAt) return NextResponse.json({ error: 'Date de publication requise' }, { status: 400 });

  const date = new Date(scheduledAt);
  if (isNaN(date.getTime())) return NextResponse.json({ error: 'Date invalide' }, { status: 400 });
  if (date.getTime() <= Date.now()) return NextResponse.json({ error: 'La date doit être dans le futur' }, { status: 400 });

  const token = req.cookies.get('sb-access-token')!.value;
  const client = adminClient(token);

  const { data, error } = await client
    .from('articles')
    .update({
      status: 'scheduled',
      scheduled_at: scheduledAt,
    })
    .eq('id', params.articleId)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
