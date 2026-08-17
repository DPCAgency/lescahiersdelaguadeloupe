import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_ROLES = new Set(['editor', 'admin', 'super_admin']);

async function verifyAdmin(req: NextRequest) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return false;

  const token = req.cookies.get('sb-access-token')?.value;
  if (!token) return false;

  const client = createClient(supabaseUrl, anonKey);
  const { data: userData } = await client.auth.getUser(token);
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
  const isAdmin = await verifyAdmin(req);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Session expirée ou accès refusé' }, { status: 401 });
  }

  const body = await req.json() as {
    action: 'update_block' | 'create_block' | 'update_job_status';
    blockId?: string;
    jobId?: string;
    updates?: Record<string, unknown>;
    block?: Record<string, unknown>;
    status?: string;
    progress?: number;
  };

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = req.cookies.get('sb-access-token')?.value;
  const client = createClient(supabaseUrl!, anonKey!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (body.action === 'update_block' && body.blockId && body.updates) {
    const { error } = await client.rpc('update_extracted_block', {
      p_block_id: body.blockId,
      p_updates: body.updates,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  if (body.action === 'create_block' && body.block) {
    const { data, error } = await client.rpc('create_extracted_block', body.block);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, block: data });
  }

  if (body.action === 'update_job_status' && body.jobId && body.status) {
    const { error } = await client.rpc('update_import_job_status', {
      p_job_id: body.jobId,
      p_status: body.status,
      p_progress: body.progress ?? 100,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
}
