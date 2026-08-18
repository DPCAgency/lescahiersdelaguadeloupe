import { createClient } from '@supabase/supabase-js';

export default async function handler(_req: Request): Promise<Response> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return new Response('Missing config', { status: 500 });
  }

  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = new Date().toISOString();

  const { data: scheduled, error } = await client
    .from('issues')
    .select('id, publication_date')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let published = 0;
  for (const issue of scheduled ?? []) {
    const pubDate = issue.publication_date ?? now.split('T')[0];
    await client.from('issues').update({
      status: 'published',
      publication_date: pubDate,
      scheduled_at: null,
    }).eq('id', issue.id);
    published++;
  }

  return new Response(JSON.stringify({ checked: scheduled?.length ?? 0, published }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export const config = {
  schedule: '*/5 * * * *',
};
