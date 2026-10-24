'use client';

import { Printer } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/features/admin/shell/components/PageHeader';
import { QueryStates } from '@/features/admin/shell/components/QueryStates';
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge';
import { formatDateTime } from '@/shared/lib/format';
import { buttonClasses } from '@/shared/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/shared/ui/Card';
import { WhatsAppIcon } from '@/shared/ui/WhatsAppIcon';
import { useAdminOrder } from '../hooks/useOrders';
import { OrderItemsTable } from './OrderItemsTable';
import { OrderNotes } from './OrderNotes';
import { OrderStatusActions } from './OrderStatusActions';

export function OrderDetailView({ id }: { id: string }) {
  const query = useAdminOrder(id);
  return (
    <QueryStates query={query} loadingLabel="Cargando pedido…">
      {(order) => (
        <>
          <PageHeader
            title={`Pedido #${order.number}`}
            description={`Creado el ${formatDateTime(order.createdAt)}`}
            back={
              <Link href="/admin/pedidos" className="inline-flex min-h-9 items-center text-sm text-slate-500 hover:text-brand">
                ← Pedidos
              </Link>
            }
            actions={
              <>
                {order.customerWhatsappUrl ? (
                  <a href={order.customerWhatsappUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses('whatsapp')}>
                    <WhatsAppIcon className="h-4 w-4" /> Escribir al cliente
                  </a>
                ) : null}
                <Link href={`/admin/pedidos/${order.id}/imprimir`} target="_blank" className={buttonClasses('outline')}>
                  <Printer className="h-4 w-4" aria-hidden="true" /> Imprimir
                </Link>
              </>
            }
          />
          <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estado</CardTitle>
                  <OrderStatusBadge status={order.status} />
                </CardHeader>
                <CardBody className="space-y-2">
                  <OrderStatusActions order={order} />
                  <p className="text-xs text-slate-500">
                    Inventario: {order.stockApplied ? 'descontado del stock.' : 'aún no descontado (se descuenta al confirmar).'}
                  </p>
                </CardBody>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Productos ({order.itemsCount})</CardTitle>
                </CardHeader>
                <CardBody className="overflow-x-auto">
                  <OrderItemsTable order={order} />
                </CardBody>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cliente</CardTitle>
                </CardHeader>
                <CardBody className="space-y-1 text-sm">
                  <p className="font-semibold">{order.customer.name}</p>
                  <p>
                    <a href={`tel:${order.customer.phone}`} className="text-brand hover:underline">
                      {order.customer.phone}
                    </a>
                  </p>
                  {order.customer.email ? <p className="break-all">{order.customer.email}</p> : null}
                  <p className="pt-2 text-slate-600">
                    {order.customer.address}
                    <br />
                    {order.customer.city}
                  </p>
                  {order.customer.notes ? (
                    <p className="mt-2 rounded-lg bg-amber-50 p-2 text-amber-900">
                      <span className="font-medium">Notas del cliente:</span> {order.customer.notes}
                    </p>
                  ) : null}
                </CardBody>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Historial</CardTitle>
                </CardHeader>
                <CardBody>
                  <OrderNotes order={order} />
                </CardBody>
              </Card>
            </div>
          </div>
        </>
      )}
    </QueryStates>
  );
}
