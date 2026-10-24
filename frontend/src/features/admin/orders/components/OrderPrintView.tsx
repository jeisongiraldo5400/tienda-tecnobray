'use client';

import { Printer } from 'lucide-react';
import { useEffect } from 'react';
import { QueryStates } from '@/features/admin/shell/components/QueryStates';
import { ORDER_STATUS_LABELS } from '@/features/orders/adapters/order.adapter';
import { formatDateTime } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import type { AdminOrderDetail } from '../adapters/admin-order.adapter';
import { useAdminOrder } from '../hooks/useOrders';
import { OrderItemsTable } from './OrderItemsTable';

function Printable({ order, storeName }: { order: AdminOrderDetail; storeName: string }) {
  useEffect(() => {
    const id = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <article className="mx-auto max-w-3xl bg-white p-8 text-slate-900 print:p-0">
      <div className="no-print mb-6 flex justify-end">
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden="true" /> Imprimir
        </Button>
      </div>
      <header className="flex items-start justify-between border-b border-slate-300 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold">{storeName}</h1>
          <p className="text-sm text-slate-500">Orden de pedido</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">#{order.number}</p>
          <p className="text-sm">{formatDateTime(order.createdAt)}</p>
          <p className="text-sm">Estado: {ORDER_STATUS_LABELS[order.status]}</p>
        </div>
      </header>
      <section className="grid grid-cols-2 gap-6 py-4 text-sm">
        <div>
          <h2 className="mb-1 font-semibold uppercase tracking-wide text-slate-500">Cliente</h2>
          <p className="font-medium">{order.customer.name}</p>
          <p>{order.customer.phone}</p>
          {order.customer.email ? <p>{order.customer.email}</p> : null}
        </div>
        <div>
          <h2 className="mb-1 font-semibold uppercase tracking-wide text-slate-500">Entrega</h2>
          <p>{order.customer.address}</p>
          <p>{order.customer.city}</p>
          {order.customer.notes ? <p className="mt-1 italic">Notas: {order.customer.notes}</p> : null}
        </div>
      </section>
      <OrderItemsTable order={order} showImages={false} />
      <footer className="mt-10 grid grid-cols-2 gap-10 pt-10 text-center text-xs text-slate-500">
        <div className="border-t border-slate-400 pt-1">Firma de quien despacha</div>
        <div className="border-t border-slate-400 pt-1">Firma de quien recibe</div>
      </footer>
    </article>
  );
}

export function OrderPrintView({ id, storeName }: { id: string; storeName: string }) {
  const query = useAdminOrder(id);
  return <QueryStates query={query}>{(order) => <Printable order={order} storeName={storeName} />}</QueryStates>;
}
