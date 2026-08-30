import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { data: issue } = await supabaseAdmin
    .from('issues')
    .select('slug')
    .eq('issue_number', '02')
    .maybeSingle();

  redirect(`/les-cahiers/${issue?.slug ?? 'numero-02'}`);
}
