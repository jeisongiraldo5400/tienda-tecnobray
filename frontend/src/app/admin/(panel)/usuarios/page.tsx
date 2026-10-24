import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdminUser } from '@/features/admin/auth/services/session.server';
import { UsersManager } from '@/features/admin/users/components/UsersManager';

export const metadata: Metadata = { title: 'Usuarios y roles' };

export default async function Page() {
  const user = await getAdminUser();
  if (user?.role !== 'admin') redirect('/admin');
  return <UsersManager />;
}
