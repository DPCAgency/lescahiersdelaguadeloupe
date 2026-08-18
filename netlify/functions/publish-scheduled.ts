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

  // Publish scheduled issues
  const { data: scheduledIssues, error: issueErr } = await client
    .from('issues')
    .select('id, publication_date')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now);

  let issuesPublished = 0;
  if (issueErr) {
    console.error('Issue query error:', issueErr.message);
  } else {
    for (const issue of scheduledIssues ?? []) {
      const pubDate = issue.publication_date ?? now.split('T')[0];
      await client.from('issues').update({
        status: 'published',
        publication_date: pubDate,
        scheduled_at: null,
      }).eq('id', issue.id);
      issuesPublished++;
    }
  }

  // Publish scheduled articles
  const { data: scheduledArticles, error: articleErr } = await client
    .from('articles')
    .select('id, published_at')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now);

  let articlesPublished = 0;
  if (articleErr) {
    console.error('Article query error:', articleErr.message);
  } else {
    for (const article of scheduledArticles ?? []) {
      await client.from('articles').update({
        status: 'published',
        published_at: article.published_at ?? now,
        scheduled_at: null,
      }).eq('id', article.id);
      articlesPublished++;
    }
  }

  return new Response(JSON.stringify({
    checked: (scheduledIssues?.length ?? 0) + (scheduledArticles?.length ?? 0),
    issuesPublished,
    articlesPublished,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export const config = {
  schedule: '*/5 * * * *',
};
