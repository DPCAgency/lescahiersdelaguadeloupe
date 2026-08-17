import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/supabase/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const ADMIN_ROLES = new Set(['editor', 'admin', 'super_admin']);

async function verifyAdmin(req: NextRequest): Promise<SupabaseClient | null> {
  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  const token = req.cookies.get('sb-access-token')?.value;
  if (!token) return null;

  const authClient = createClient(supabaseUrl, anonKey);
  const { data: userData } = await authClient.auth.getUser(token);
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

  return userClient;
}

export async function POST(req: NextRequest) {
  try {
    const db = await verifyAdmin(req);
    if (!db) {
      return NextResponse.json({ error: 'Session expirée ou accès refusé' }, { status: 401 });
    }

    const body = await req.json() as { jobId: string };
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'jobId requis' }, { status: 400 });
    }

    const { data: job, error: jobErr } = await db
      .from('import_jobs')
      .select('id, status')
      .eq('id', jobId)
      .maybeSingle();

    if (jobErr || !job) {
      return NextResponse.json({ error: 'Import introuvable' }, { status: 404 });
    }

    if (job.status === 'processing') {
      return NextResponse.json({ success: true, jobId, status: 'processing', message: 'Analyse déjà en cours' }, { status: 202 });
    }

    // Trigger the background function
    const supabaseUrl = getSupabaseUrl();
    const anonKey = getSupabaseAnonKey();

    const bgResp = await fetch(`${supabaseUrl}/functions/v1/storage-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ jobId }),
    }).catch(() => null);

    // Also try the Netlify background function directly
    const siteUrl = process.env.URL || process.env.DEPLOY_URL || `https://${req.headers.get('host')}`;
    await fetch(`${siteUrl}/process-import-background`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    }).catch((err) => {
      console.error(`[import/analyze] Failed to trigger background function: ${err instanceof Error ? err.message : 'unknown'}`);
    });

    if (bgResp && !bgResp.ok) {
      console.warn(`[import/analyze] Storage admin trigger returned ${bgResp.status}`);
    }

    console.log(`[import/analyze] Background function triggered — job=${jobId}`);

    return NextResponse.json({
      success: true,
      jobId,
      status: 'processing',
    }, { status: 202 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error(`[import/analyze] Error: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
