import type { Metadata } from 'next';
import { DashboardView } from '@/features/admin/dashboard/components/DashboardView';

export const metadata: Metadata = { title: 'Inicio' };

export default function AdminDashboardPage() {
  return <DashboardView />;
}
