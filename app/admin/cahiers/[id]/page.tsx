import CahierEditorClient from '@/components/admin/cahier-editor-client';

export const dynamic = 'force-dynamic';

export default async function CahierEditorPage({ params }: { params: { id: string } }) {
  return <CahierEditorClient issueId={params.id} />;
}
