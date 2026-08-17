import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/supabase/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const ADMIN_ROLES = new Set(['editor', 'admin', 'super_admin']);

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  const token = req.cookies.get('sb-access-token')?.value;
  if (!token) return false;

  const authClient = createClient(supabaseUrl, anonKey);
  const { data: userData } = await authClient.auth.getUser(token);
  if (!userData?.user?.id) return false;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profile } = await userClient
    .from('profiles')
    .select('role, status')
    .eq('id', userData.user.id)
    .maybeSingle();

  return Boolean(profile && ADMIN_ROLES.has(profile.role) && profile.status === 'active');
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Session expirée ou accès refusé' }, { status: 401 });
    }

    const body = await req.json() as { jobId: string };
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'jobId requis' }, { status: 400 });
    }

    const supabaseUrl = getSupabaseUrl();
    const anonKey = getSupabaseAnonKey();
    const token = req.cookies.get('sb-access-token')?.value;

    const client = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: job, error: jobErr } = await client
      .from('import_jobs')
      .select('id, status')
      .eq('id', jobId)
      .maybeSingle();

    if (jobErr || !job) {
      return NextResponse.json({ error: 'Import introuvable' }, { status: 404 });
    }

    if (job.status === 'processing') {
      return NextResponse.json({ success: true, jobId, status: 'processing' }, { status: 202 });
    }

    // Trigger the Netlify Background Function
    const siteUrl = process.env.URL || process.env.DEPLOY_URL || `https://${req.headers.get('host')}`;

    console.log(`[import/analyze/start] Triggering background function — job=${jobId} url=${siteUrl}/process-import`);

    fetch(`${siteUrl}/process-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    }).catch((err) => {
      console.error(`[import/analyze/start] Failed to trigger background function: ${err instanceof Error ? err.message : 'unknown'}`);
    });

    return NextResponse.json({
      success: true,
      jobId,
      status: 'queued',
    }, { status: 202 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error(`[import/analyze/start] Error: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
