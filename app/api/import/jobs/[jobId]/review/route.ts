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

export async function GET(req: NextRequest, { params }: { params: { jobId: string } }) {
  const isAdmin = await verifyAdmin(req);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Session expirée ou accès refusé' }, { status: 401 });
  }

  const jobId = params.jobId;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = req.cookies.get('sb-access-token')?.value;
  const client = createClient(supabaseUrl!, anonKey!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: blocks } = await client
    .from('extracted_blocks')
    .select('*')
    .eq('import_job_id', jobId)
    .order('page_number', { ascending: true })
    .order('created_at', { ascending: true });

  const { data: suggestions } = await client
    .from('ai_suggestions')
    .select('*')
    .eq('import_job_id', jobId)
    .eq('suggestion_type', 'article_grouping')
    .order('created_at', { ascending: true });

  const { data: issues } = await client
    .from('issues')
    .select('id, title, issue_number')
    .order('issue_number');

  return NextResponse.json({
    blocks: blocks ?? [],
    suggestions: suggestions ?? [],
    issues: issues ?? [],
  });
}
