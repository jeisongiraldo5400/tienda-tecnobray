'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { DataTable, type Column } from '@/features/admin/shell/components/DataTable';
import { PageHeader } from '@/features/admin/shell/components/PageHeader';
import { SearchInput } from '@/features/admin/shell/components/SearchInput';
import { ORDER_STATUS_LABELS, toOrderStatus } from '@/features/orders/adapters/order.adapter';
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge';
import { getErrorMessage } from '@/shared/api/errors';
import { formatCOP, formatDateTime } from '@/shared/lib/format';
import { ORDER_STATUSES } from '@/shared/types/domain';
import { Input, Select } from '@/shared/ui/Input';
import { ButtonPagination } from '@/shared/ui/Pagination';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/States';
import type { AdminOrderListItem } from '../adapters/admin-order.adapter';
import { useAdminOrders } from '../hooks/useOrders';
import type { AdminOrderFilters } from '../services/orders.service';

export function OrdersList() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filters: AdminOrderFilters = useMemo(
    () => ({
      q: params.get('q') || undefined,
      status: params.get('estado') ? toOrderStatus(params.get('estado')) : undefined,
      dateFrom: params.get('desde') || undefined,
      dateTo: params.get('hasta') || undefined,
      page: Number(params.get('pagina')) || 1,
      pageSize: 20,
    }),
    [params],
  );
  const set = useCallback(
    (patch: Record<string, string | undefined>) => {
      const sp = new URLSearchParams(params.toString());
      Object.entries(patch).forEach(([k, v]) => (v ? sp.set(k, v) : sp.delete(k)));
      if (!('pagina' in patch)) sp.delete('pagina');
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );
  const query = useAdminOrders(filters);

  const columns: Column<AdminOrderListItem>[] = [
    {
      key: 'number',
      header: 'Pedido',
      cell: (o) => (
        <Link href={`/admin/pedidos/${o.id}`} className="font-semibold text-brand hover:underline">
          #{o.number}
        </Link>
      ),
    },
    { key: 'date', header: 'Fecha', cell: (o) => <span className="whitespace-nowrap text-slate-600">{formatDateTime(o.createdAt)}</span> },
    {
      key: 'customer',
      header: 'Cliente',
      cell: (o) => (
        <div>
          <p className="font-medium">{o.customerName}</p>
          <p className="text-xs text-slate-500">
            {o.phone} · {o.city}
          </p>
        </div>
      ),
    },
    { key: 'items', header: 'Artículos', className: 'text-right', cell: (o) => o.itemsCount },
    { key: 'total', header: 'Total', className: 'text-right', cell: (o) => <span className="font-semibold">{formatCOP(o.total)}</span> },
    { key: 'status', header: 'Estado', cell: (o) => <OrderStatusBadge status={o.status} /> },
  ];

  return (
    <div>
      <PageHeader title="Pedidos" description={query.data ? `${query.data.total} pedidos` : undefined} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput value={params.get('q') ?? ''} onChange={(q) => set({ q: q || undefined })} placeholder="Número, nombre, correo o teléfono" />
        <Select aria-label="Filtrar por estado" className="sm:w-44" value={params.get('estado') ?? ''} onChange={(e) => set({ estado: e.target.value || undefined })}>
          <option value="">Todos los estados</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-600 sm:flex-row sm:items-center sm:gap-2 sm:text-sm sm:font-normal">
            Desde
            <Input type="date" className="sm:w-40" value={params.get('desde') ?? ''} onChange={(e) => set({ desde: e.target.value || undefined })} />
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-600 sm:flex-row sm:items-center sm:gap-2 sm:text-sm sm:font-normal">
            Hasta
            <Input type="date" className="sm:w-40" value={params.get('hasta') ?? ''} onChange={(e) => set({ hasta: e.target.value || undefined })} />
          </label>
        </div>
      </div>
      {query.isPending ? (
        <LoadingState label="Cargando pedidos…" />
      ) : query.isError ? (
        <ErrorState description={getErrorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : query.data.items.length === 0 ? (
        <EmptyState title="No hay pedidos" description={params.toString() ? 'Prueba con otros filtros.' : 'Los pedidos de la tienda aparecerán aquí.'} />
      ) : (
        <div className={query.isPlaceholderData ? 'opacity-60' : ''}>
          <DataTable caption="Pedidos" columns={columns} rows={query.data.items} rowKey={(o) => o.id} />
          <ButtonPagination className="mt-4" page={query.data.page} totalPages={query.data.totalPages} onChange={(p) => set({ pagina: String(p) })} />
        </div>
      )}
    </div>
  );
}
