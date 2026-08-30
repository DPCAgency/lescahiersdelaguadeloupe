import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_SUBJECTS = new Set([
  'Information / témoignage',
  'Proposition de sujet',
  'Question sur un article',
  'Contacter la rédaction',
  'Partenariat',
  'Problème technique',
  'Données personnelles',
  'Autre',
]);

function sanitize(str: string, maxLen: number): string {
  return str.slice(0, maxLen).trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = sanitize(String(body.name ?? ''), 100);
    const firstName = sanitize(String(body.first_name ?? ''), 100);
    const email = sanitize(String(body.email ?? ''), 200);
    const phone = sanitize(String(body.phone ?? ''), 30);
    const subject = sanitize(String(body.subject ?? ''), 100);
    const message = sanitize(String(body.message ?? ''), 5000);

    if (!name) return NextResponse.json({ error: 'Le nom est obligatoire.' }, { status: 400 });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Email invalide.' }, { status: 400 });
    if (!subject || !VALID_SUBJECTS.has(subject)) return NextResponse.json({ error: 'Objet invalide.' }, { status: 400 });
    if (!message) return NextResponse.json({ error: 'Le message est obligatoire.' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('contact_requests').insert({
      name,
      first_name: firstName || null,
      email,
      phone: phone || null,
      subject,
      message,
      status: 'new',
    });

    if (error) {
      console.error('Contact insert error:', error);
      return NextResponse.json({ error: 'Impossible d\'enregistrer le message. Réessayez dans quelques instants.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue.' }, { status: 500 });
  }
}
