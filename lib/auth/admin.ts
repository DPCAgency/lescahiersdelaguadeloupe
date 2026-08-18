import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_ROLES = new Set(['editor', 'admin', 'super_admin']);

export function sanitizeRedirect(target: string | null): string {
  if (!target) return '/mon-compte';
  if (!target.startsWith('/')) return '/mon-compte';
  if (target.startsWith('//')) return '/mon-compte';
  if (target.startsWith('/\\')) return '/mon-compte';
  return target;
}

export interface AdminUser {
  id: string;
  role: string;
  email: string | null;
}

export async function getAdminFromToken(token: string | undefined): Promise<AdminUser | null> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey || !token) return null;

  try {
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
    if (!ADMIN_ROLES.has(profile.role)) return null;

    return { id: userData.user.id, role: profile.role, email: userData.user.email ?? null };
  } catch {
    return null;
  }
}

export async function requireAdmin(req: NextRequest): Promise<AdminUser | null> {
  const token = req.cookies.get('sb-access-token')?.value;
  return getAdminFromToken(token);
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: 'Session expirée ou accès refusé' }, { status: 401 });
}

export function forbiddenResponse(): NextResponse {
  return NextResponse.json({ error: 'Accès refusé. Permissions insuffisantes.' }, { status: 403 });
}
