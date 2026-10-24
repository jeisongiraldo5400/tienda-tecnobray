import type { Metadata } from 'next';
import { OrderPrintView } from '@/features/admin/orders/components/OrderPrintView';
import { getStoreSettings } from '@/features/settings/services/settings.server';

export const metadata: Metadata = { title: 'Imprimir pedido' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, settings] = await Promise.all([params, getStoreSettings()]);
  return <OrderPrintView id={id} storeName={settings.storeName} />;
}
