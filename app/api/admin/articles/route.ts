import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getEditorialUser, getPermissions } from '@/lib/permissions/editorial';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function editorialClient(token: string) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(req: NextRequest) {
  const user = await getEditorialUser(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const token = req.cookies.get('sb-access-token')!.value;
  const client = editorialClient(token);
  const perms = getPermissions(user.role);

  let query = client
    .from('articles')
    .select('id, title, slug, subtitle, excerpt, format, category_id, author_id, hero_image_path, hero_caption, hero_credit, status, featured, published_at, scheduled_at, created_at, updated_at, created_by')
    .order('created_at', { ascending: false });

  // Authors only see their own articles
  if (!perms.canEditAllArticles) {
    query = query.eq('created_by', user.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await getEditorialUser(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const perms = getPermissions(user.role);
  if (!perms.canCreateArticle) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const body = await req.json() as {
    title?: string;
    subtitle?: string;
    excerpt?: string;
    format?: string;
    category_id?: string;
    author_id?: string;
    hero_image_path?: string;
    hero_caption?: string;
    hero_credit?: string;
    status?: string;
    featured?: boolean;
  };

  const token = req.cookies.get('sb-access-token')!.value;
  const client = editorialClient(token);

  const title = body.title || 'Nouvel article';
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

  // Authors: auto-assign author_id from profile, force created_by, force draft
  const insertData: Record<string, unknown> = {
    title,
    slug,
    subtitle: body.subtitle || null,
    excerpt: body.excerpt || null,
    format: body.format || 'standard',
    category_id: body.category_id || null,
    hero_image_path: body.hero_image_path || null,
    hero_caption: body.hero_caption || null,
    hero_credit: body.hero_credit || null,
    status: 'draft',
    featured: false,
    created_by: user.id,
  };

  if (perms.canEditAllArticles) {
    // Editors/admins can set author_id, status, featured
    insertData.author_id = body.author_id || null;
    insertData.status = body.status || 'draft';
    insertData.featured = body.featured ?? false;
  } else {
    // Authors: auto-assign their author_id
    insertData.author_id = user.author_id || null;
  }

  const { data, error } = await client
    .from('articles')
    .insert(insertData)
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
