import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_ROLES = new Set(['editor', 'admin', 'super_admin']);

async function getAuthenticatedUser(req: NextRequest) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  const token = req.cookies.get('sb-access-token')?.value;
  console.log('[import/jobs] cookie present:', !!token);
  if (!token) return null;

  const client = createClient(supabaseUrl, anonKey);
  const { data: userData, error: authErr } = await client.auth.getUser(token);
  console.log('[import/jobs] auth result:', { userId: userData?.user?.id, authError: authErr?.message });
  if (!userData?.user?.id) return null;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profile, error: profileErr } = await userClient
    .from('profiles')
    .select('role, status')
    .eq('id', userData.user.id)
    .maybeSingle();
  console.log('[import/jobs] profile:', { role: profile?.role, status: profile?.status, error: profileErr?.message });

  if (!profile || !ADMIN_ROLES.has(profile.role) || profile.status !== 'active') return null;

  return { id: userData.user.id, role: profile.role };
}

export async function GET(req: NextRequest, { params }: { params: { jobId: string } }) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    console.log('[import/jobs] auth failed — returning 401');
    return NextResponse.json({ error: 'Session expirée' }, { status: 401 });
  }

  const jobId = params.jobId;
  console.log('[import/jobs] GET — jobId:', jobId, 'user:', user.id);

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = req.cookies.get('sb-access-token')?.value;

  const client = createClient(supabaseUrl!, anonKey!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: job, error } = await client.rpc('get_import_job', { p_job_id: jobId });
  console.log('[import/jobs] RPC result:', { found: !!job, error: error?.message });

  if (error) {
    console.error('[import/jobs] RPC error:', error.message);
    return NextResponse.json({ error: 'Erreur serveur', detail: error.message }, { status: 500 });
  }

  if (!job) {
    console.log('[import/jobs] job not found — returning 404');
    return NextResponse.json({ error: 'Import introuvable' }, { status: 404 });
  }

  return NextResponse.json(job);
}
