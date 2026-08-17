import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_ROLES = new Set(['editor', 'admin', 'super_admin']);
const WRITE_ROLES = new Set(['admin', 'super_admin']);

const TEXT_KEYS = new Set([
  'site_name', 'site_tagline', 'site_logo', 'favicon',
  'primary_color', 'contact_email', 'editorial_signature', 'footer_text',
]);

const FLAG_KEYS = new Set([
  'subscriptions_enabled', 'page_purchase_enabled',
  'full_issue_purchase_enabled', 'pdf_download_enabled', 'ai_import_enabled',
]);

async function verifyAdmin(req: NextRequest, requireWrite = false) {
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

  if (!profile || profile.status !== 'active') return null;
  const roles = requireWrite ? WRITE_ROLES : ADMIN_ROLES;
  if (!roles.has(profile.role)) return null;

  return { id: userData.user.id, role: profile.role };
}

export async function GET(req: NextRequest) {
  const user = await verifyAdmin(req);
  if (!user) {
    return NextResponse.json({ error: 'Session expirée ou accès refusé' }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = req.cookies.get('sb-access-token')?.value;
  const client = createClient(supabaseUrl!, anonKey!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const allTextKeys = Array.from(TEXT_KEYS);
  const allFlagKeys = Array.from(FLAG_KEYS);

  const { data: textRows } = await client
    .from('site_settings')
    .select('key, value_json')
    .in('key', allTextKeys);

  const { data: flagRows } = await client
    .from('feature_flags')
    .select('key, value')
    .in('key', allFlagKeys);

  const settings: Record<string, string> = {};
  (textRows ?? []).forEach((row) => {
    const val = row.value_json;
    settings[row.key] = typeof val === 'string' ? val : JSON.stringify(val ?? '');
  });

  const flags: Record<string, boolean> = {};
  (flagRows ?? []).forEach((row) => {
    flags[row.key] = Boolean(row.value);
  });

  return NextResponse.json({ settings, flags });
}

export async function PUT(req: NextRequest) {
  const user = await verifyAdmin(req, true);
  if (!user) {
    return NextResponse.json({ error: 'Accès refusé. Permissions admin requises.' }, { status: 403 });
  }

  const body = await req.json() as {
    settings?: Record<string, string>;
    flags?: Record<string, boolean>;
  };

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = req.cookies.get('sb-access-token')?.value;
  const client = createClient(supabaseUrl!, anonKey!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const errors: string[] = [];

  if (body.settings) {
    for (const [key, value] of Object.entries(body.settings)) {
      if (!TEXT_KEYS.has(key)) {
        errors.push(`Clé non autorisée: ${key}`);
        continue;
      }
      const { error } = await client
        .from('site_settings')
        .upsert({ key, value_json: value }, { onConflict: 'key' });
      if (error) errors.push(`${key}: ${error.message}`);
    }
  }

  if (body.flags) {
    for (const [key, value] of Object.entries(body.flags)) {
      if (!FLAG_KEYS.has(key)) {
        errors.push(`Clé non autorisée: ${key}`);
        continue;
      }
      const { error } = await client
        .from('feature_flags')
        .upsert({ key, value: Boolean(value) }, { onConflict: 'key' });
      if (error) errors.push(`${key}: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join('; ') }, { status: 400 });
  }

  // Re-read to confirm
  const allFlagKeys = Array.from(FLAG_KEYS);
  const { data: flagRows } = await client
    .from('feature_flags')
    .select('key, value')
    .in('key', allFlagKeys);

  const flags: Record<string, boolean> = {};
  (flagRows ?? []).forEach((row) => {
    flags[row.key] = Boolean(row.value);
  });

  return NextResponse.json({ success: true, flags });
}
