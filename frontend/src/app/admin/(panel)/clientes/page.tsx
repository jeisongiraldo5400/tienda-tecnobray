import type { Metadata } from 'next';
import { CustomersList } from '@/features/admin/customers/components/CustomersList';

export const metadata: Metadata = { title: 'Clientes' };

export default function Page() {
  return <CustomersList />;
}
