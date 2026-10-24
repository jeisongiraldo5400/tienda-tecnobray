'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, DollarSign, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useAdminUser } from '@/features/admin/auth/hooks/AdminSessionProvider';
import { PageHeader } from '@/features/admin/shell/components/PageHeader';
import { QueryStates } from '@/features/admin/shell/components/QueryStates';
import { ORDER_STATUS_LABELS } from '@/features/orders/adapters/order.adapter';
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge';
import { adminApi } from '@/shared/api/browser-client';
import { endpoints } from '@/shared/api/endpoints';
import { formatCOP, formatDateTime } from '@/shared/lib/format';
import { ORDER_STATUSES } from '@/shared/types/domain';
import { Card, CardBody, CardHeader, CardTitle } from '@/shared/ui/Card';
import { RemoteImage } from '@/shared/ui/RemoteImage';
import { toDashboard } from '../adapters/dashboard.adapter';
import { StatCard } from './StatCard';

export function DashboardView() {
  const user = useAdminUser();
  const query = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => toDashboard(await adminApi.get(endpoints.admin.dashboard)),
    refetchInterval: 60_000,
  });

  return (
    <div>
      <PageHeader title={`Hola, ${user.name.split(' ')[0]}`} description="Resumen de la tienda." />
      <QueryStates query={query} loadingLabel="Cargando resumen…">
        {(d) => (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <StatCard label="Pedidos hoy" value={d.ordersToday} hint={`${d.ordersWeek} en los últimos 7 días`} icon={<ShoppingCart className="h-4 w-4" />} />
              <StatCard label="Ventas hoy" value={formatCOP(d.salesToday)} hint={`Semana: ${formatCOP(d.salesWeek)}`} icon={<DollarSign className="h-4 w-4" />} />
              <StatCard label="Ventas del mes" value={formatCOP(d.salesMonth)} hint={`Histórico: ${formatCOP(d.salesTotal)}`} icon={<DollarSign className="h-4 w-4" />} />
              <StatCard
                label="Pendientes por confirmar"
                value={d.pendingOrders}
                hint={<Link href="/admin/pedidos?estado=nuevo" className="text-brand hover:underline">Ver pedidos nuevos</Link>}
                icon={<Clock className="h-4 w-4" />}
                tone={d.pendingOrders > 0 ? 'warning' : 'default'}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {ORDER_STATUSES.map((s) => (
                <Link key={s} href={`/admin/pedidos?estado=${s}`} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:border-brand hover:text-brand">
                  {ORDER_STATUS_LABELS[s]}: <strong>{d.ordersByStatus[s]}</strong>
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <Card>
                <CardHeader>
                  <CardTitle>Últimos pedidos</CardTitle>
                  <Link href="/admin/pedidos" className="text-sm font-medium text-brand hover:underline">
                    Ver todos
                  </Link>
                </CardHeader>
                <CardBody className="p-0">
                  {d.latestOrders.length === 0 ? (
                    <p className="p-5 text-sm text-slate-500">Aún no hay pedidos.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {d.latestOrders.map((o) => (
                        <li key={o.id}>
                          <Link href={`/admin/pedidos/${o.id}`} className="flex flex-col gap-2 px-4 py-3 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5">
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                #{o.number} · <span className="text-slate-600">{o.customerName}</span>
                              </p>
                              <p className="text-xs text-slate-500">{formatDateTime(o.createdAt)}</p>
                            </div>
                            <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                              <span className="font-semibold tabular-nums">{formatCOP(o.total)}</span>
                              <OrderStatusBadge status={o.status} />
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" /> Stock bajo ({d.lowStockCount})
                  </CardTitle>
                  <Link href="/admin/productos?estado=stock-bajo" className="text-sm font-medium text-brand hover:underline">
                    Ver
                  </Link>
                </CardHeader>
                <CardBody className="p-0">
                  {d.lowStock.length === 0 ? (
                    <p className="p-5 text-sm text-slate-500">Todo el inventario está por encima de {d.lowStockThreshold} unidades.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {d.lowStock.map((p) => (
                        <li key={p.id}>
                          <Link href={`/admin/productos/${p.id}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50">
                            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded border border-slate-100 bg-white">
                              <RemoteImage src={p.thumbUrl} alt="" fill sizes="36px" className="object-contain" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{p.name}</p>
                              <p className="text-xs text-slate-500">SKU {p.sku}</p>
                            </div>
                            <span className={p.stock <= 0 ? 'font-bold text-red-600' : 'font-bold text-amber-600'}>{p.stock}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        )}
      </QueryStates>
    </div>
  );
}
