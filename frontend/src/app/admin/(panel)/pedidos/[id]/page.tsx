import type { Metadata } from 'next';
import { OrderDetailView } from '@/features/admin/orders/components/OrderDetailView';

export const metadata: Metadata = { title: 'Detalle del pedido' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetailView id={id} />;
}
