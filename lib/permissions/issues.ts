import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { getRequiredServiceRoleClient } from '@/lib/supabase/server';

const ADMIN_ROLES = new Set(['admin', 'super_admin']);
const EDITOR_ROLES = new Set(['editor', 'admin', 'super_admin']);

export interface IssueUser {
  id: string;
  role: string;
  email: string | null;
}

export interface IssuePermissions {
  canView: boolean;
  canEditContent: boolean;
  canEditMetadata: boolean;
  canUploadPdf: boolean;
  canReplacePdf: boolean;
  canDeletePdf: boolean;
  canSubmit: boolean;
  canReview: boolean;
  canPublish: boolean;
  canSchedule: boolean;
  canArchive: boolean;
  canDelete: boolean;
  canManageCollaborators: boolean;
}

const FULL_PERMISSIONS: IssuePermissions = {
  canView: true,
  canEditContent: true,
  canEditMetadata: true,
  canUploadPdf: true,
  canReplacePdf: true,
  canDeletePdf: true,
  canSubmit: true,
  canReview: true,
  canPublish: true,
  canSchedule: true,
  canArchive: true,
  canDelete: true,
  canManageCollaborators: true,
};

const EDITOR_PERMISSIONS: IssuePermissions = {
  canView: true,
  canEditContent: true,
  canEditMetadata: true,
  canUploadPdf: true,
  canReplacePdf: true,
  canDeletePdf: true,
  canSubmit: true,
  canReview: true,
  canPublish: true,
  canSchedule: true,
  canArchive: true,
  canDelete: false,
  canManageCollaborators: true,
};

const CONTRIBUTOR_PERMISSIONS: IssuePermissions = {
  canView: true,
  canEditContent: true,
  canEditMetadata: false,
  canUploadPdf: true,
  canReplacePdf: false,
  canDeletePdf: false,
  canSubmit: true,
  canReview: false,
  canPublish: false,
  canSchedule: false,
  canArchive: false,
  canDelete: false,
  canManageCollaborators: false,
};

const NO_PERMISSIONS: IssuePermissions = {
  canView: false,
  canEditContent: false,
  canEditMetadata: false,
  canUploadPdf: false,
  canReplacePdf: false,
  canDeletePdf: false,
  canSubmit: false,
  canReview: false,
  canPublish: false,
  canSchedule: false,
  canArchive: false,
  canDelete: false,
  canManageCollaborators: false,
};

export async function getIssueUser(req: NextRequest): Promise<IssueUser | null> {
  const token = req.cookies.get('sb-access-token')?.value;
  if (!token) return null;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  try {
    const client = createClient(supabaseUrl, anonKey);
    const { data: userData } = await client.auth.getUser(token);
    if (!userData?.user?.id) return null;

    const admin = getRequiredServiceRoleClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('role, status')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (!profile || profile.status !== 'active') return null;
    if (!['author', 'editor', 'admin', 'super_admin'].includes(profile.role)) return null;

    return {
      id: userData.user.id,
      role: profile.role,
      email: userData.user.email ?? null,
    };
  } catch {
    return null;
  }
}

export async function getIssuePermissions(
  user: IssueUser,
  issueId: string,
): Promise<IssuePermissions> {
  // Priority: admin/super_admin => full access
  if (ADMIN_ROLES.has(user.role)) return FULL_PERMISSIONS;

  // Editor => editor permissions
  if (user.role === 'editor') return EDITOR_PERMISSIONS;

  // Author: check if assigned as collaborator
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return NO_PERMISSIONS;

  try {
    const client = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: collab } = await client
      .from('issue_collaborators')
      .select('role')
      .eq('issue_id', issueId)
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!collab) return NO_PERMISSIONS;

    if (collab.role === 'editor') return { ...EDITOR_PERMISSIONS, canDelete: false };

    return CONTRIBUTOR_PERMISSIONS;
  } catch {
    return NO_PERMISSIONS;
  }
}

export function canAccessIssuesList(user: IssueUser): boolean {
  return EDITOR_ROLES.has(user.role);
}
