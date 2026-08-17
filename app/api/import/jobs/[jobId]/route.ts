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
  if (!token) return null;

  const client = createClient(supabaseUrl, anonKey);
  const { data: userData } = await client.auth.getUser(token);
  if (!userData?.user?.id) return null;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profile } = await userClient
    .from('profiles')
    .select('role, status')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (!profile || !ADMIN_ROLES.has(profile.role) || profile.status !== 'active') return null;

  return { id: userData.user.id, role: profile.role };
}

export async function GET(req: NextRequest, { params }: { params: { jobId: string } }) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Session expirée' }, { status: 401 });
  }

  const jobId = params.jobId;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = req.cookies.get('sb-access-token')?.value;

  const client = createClient(supabaseUrl!, anonKey!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: job, error } = await client.rpc('get_import_job', { p_job_id: jobId });

  if (error) {
    return NextResponse.json({ error: 'Erreur serveur', detail: error.message }, { status: 500 });
  }

  if (!job) {
    return NextResponse.json({ error: 'Import introuvable' }, { status: 404 });
  }

  return NextResponse.json(job);
}
