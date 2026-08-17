import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function adminClient(token: string) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const token = req.cookies.get('sb-access-token')!.value;
  const client = adminClient(token);

  const { data, error } = await client
    .from('articles')
    .select('id, title, slug, subtitle, excerpt, format, category_id, author_id, hero_image_path, hero_caption, hero_credit, status, featured, published_at, scheduled_at, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

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
  const client = adminClient(token);

  const title = body.title || 'Nouvel article';
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

  const { data, error } = await client
    .from('articles')
    .insert({
      title,
      slug,
      subtitle: body.subtitle || null,
      excerpt: body.excerpt || null,
      format: body.format || 'standard',
      category_id: body.category_id || null,
      author_id: body.author_id || null,
      hero_image_path: body.hero_image_path || null,
      hero_caption: body.hero_caption || null,
      hero_credit: body.hero_credit || null,
      status: body.status || 'draft',
      featured: body.featured ?? false,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
