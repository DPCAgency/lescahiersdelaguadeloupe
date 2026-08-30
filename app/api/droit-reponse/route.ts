import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sanitize(str: string, maxLen: number): string {
  return str.slice(0, maxLen).trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = sanitize(String(body.name ?? ''), 100);
    const firstName = sanitize(String(body.first_name ?? ''), 100);
    const organization = sanitize(String(body.organization ?? ''), 200);
    const position = sanitize(String(body.position ?? ''), 200);
    const email = sanitize(String(body.email ?? ''), 200);
    const phone = sanitize(String(body.phone ?? ''), 30);
    const articleUrl = sanitize(String(body.article_url ?? ''), 500);
    const subject = sanitize(String(body.subject ?? ''), 200);
    const message = sanitize(String(body.message ?? ''), 8000);
    const certified = Boolean(body.certified);

    if (!name) return NextResponse.json({ error: 'Le nom est obligatoire.' }, { status: 400 });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Email invalide.' }, { status: 400 });
    if (!articleUrl || !/^https?:\/\/.+/.test(articleUrl)) return NextResponse.json({ error: 'URL de l\'article invalide.' }, { status: 400 });
    if (!subject) return NextResponse.json({ error: 'L\'objet est obligatoire.' }, { status: 400 });
    if (!message) return NextResponse.json({ error: 'Le message est obligatoire.' }, { status: 400 });
    if (!certified) return NextResponse.json({ error: 'Vous devez certifier l\'exactitude des informations transmises.' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('right_of_reply_requests').insert({
      name,
      first_name: firstName || null,
      organization: organization || null,
      position: position || null,
      email,
      phone: phone || null,
      article_url: articleUrl,
      subject,
      message,
      certified,
      status: 'new',
    });

    if (error) {
      console.error('Right of reply insert error:', error);
      return NextResponse.json({ error: 'Impossible d\'enregistrer la demande. Réessayez dans quelques instants.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue.' }, { status: 500 });
  }
}
