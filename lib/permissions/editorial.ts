import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const EDITORIAL_ROLES = new Set(['author', 'editor', 'admin', 'super_admin']);
const ADMIN_ROLES = new Set(['editor', 'admin', 'super_admin']);
const PUBLISH_ROLES = new Set(['editor', 'admin', 'super_admin']);

export interface EditorialUser {
  id: string;
  role: string;
  email: string | null;
  author_id: string | null;
}

export interface EditorialPermissions {
  role: string;
  canCreateArticle: boolean;
  canEditOwnArticle: boolean;
  canEditAllArticles: boolean;
  canSubmit: boolean;
  canReview: boolean;
  canPublish: boolean;
  canSchedule: boolean;
  canDeleteOwnDraft: boolean;
  canDeleteAny: boolean;
  canManageUsers: boolean;
  canAccessAdminSettings: boolean;
}

export function getPermissions(role: string): EditorialPermissions {
  const isAdmin = ADMIN_ROLES.has(role);
  const isAuthor = role === 'author';

  return {
    role,
    canCreateArticle: EDITORIAL_ROLES.has(role),
    canEditOwnArticle: EDITORIAL_ROLES.has(role),
    canEditAllArticles: isAdmin,
    canSubmit: isAuthor || isAdmin,
    canReview: isAdmin,
    canPublish: PUBLISH_ROLES.has(role),
    canSchedule: PUBLISH_ROLES.has(role),
    canDeleteOwnDraft: EDITORIAL_ROLES.has(role),
    canDeleteAny: isAdmin,
    canManageUsers: role === 'admin' || role === 'super_admin',
    canAccessAdminSettings: isAdmin,
  };
}

export async function getEditorialUser(req: NextRequest): Promise<EditorialUser | null> {
  const token = req.cookies.get('sb-access-token')?.value;
  if (!token) return null;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

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
      .select('role, status, author_id')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (!profile || profile.status !== 'active') return null;
    if (!EDITORIAL_ROLES.has(profile.role)) return null;

    return {
      id: userData.user.id,
      role: profile.role,
      email: userData.user.email ?? null,
      author_id: profile.author_id ?? null,
    };
  } catch {
    return null;
  }
}

export async function requireEditorialUser(req: NextRequest): Promise<EditorialUser | null> {
  return getEditorialUser(req);
}

export function editorialUnauthorized(): NextResponse {
  return NextResponse.json({ error: 'Session expirée ou accès refusé' }, { status: 401 });
}

export function editorialForbidden(): NextResponse {
  return NextResponse.json({ error: 'Accès refusé. Permissions insuffisantes.' }, { status: 403 });
}
