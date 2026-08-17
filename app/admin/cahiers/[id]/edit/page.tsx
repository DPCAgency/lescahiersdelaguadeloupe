import EditorialStudio from '@/components/admin/editorial-studio';

export const dynamic = 'force-dynamic';

export default async function EditCahierPage({ params }: { params: { id: string } }) {
  return <EditorialStudio issueId={params.id} />;
}
