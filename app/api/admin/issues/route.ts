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
    .from('issues')
    .select('id, issue_number, slug, title, subtitle, description, publication_date, cover_image_path, page_count, status, price_per_page, full_download_price, pdf_file_path, theme, editorial_director, free_pages_count, download_enabled, scheduled_at, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await req.json() as {
    title?: string;
    issue_number?: string;
    subtitle?: string;
    description?: string;
    publication_date?: string;
    cover_image_path?: string;
    theme?: string;
    editorial_director?: string;
  };

  const token = req.cookies.get('sb-access-token')!.value;
  const client = adminClient(token);

  const title = body.title || 'Nouveau Cahier';
  const issueNumber = body.issue_number || `N°${String(Date.now()).slice(-3)}`;
  const slug = body.issue_number
    ? `numero-${body.issue_number}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    : `numero-${Date.now()}`;

  const { data, error } = await client
    .from('issues')
    .insert({
      title,
      issue_number: issueNumber,
      slug,
      status: 'draft',
      page_count: 1,
      price_per_page: 0.30,
      full_download_price: 2.90,
      subtitle: body.subtitle || null,
      description: body.description || null,
      publication_date: body.publication_date || null,
      cover_image_path: body.cover_image_path || null,
      theme: body.theme || null,
      editorial_director: body.editorial_director || null,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
