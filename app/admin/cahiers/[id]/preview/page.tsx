import IssuePreviewClient from '@/components/admin/issue-preview-client';

export const dynamic = 'force-dynamic';

export default async function PreviewPage({ params }: { params: { id: string } }) {
  return <IssuePreviewClient issueId={params.id} />;
}
