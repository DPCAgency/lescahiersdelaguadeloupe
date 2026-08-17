import { AdminLayout } from '@/components/admin/admin-layout';

export default function AdminLayoutRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
