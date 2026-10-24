'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { DataTable, type Column } from '@/features/admin/shell/components/DataTable';
import { PageHeader } from '@/features/admin/shell/components/PageHeader';
import { SearchInput } from '@/features/admin/shell/components/SearchInput';
import { getErrorMessage } from '@/shared/api/errors';
import { formatCOP, formatDate } from '@/shared/lib/format';
import { buildWhatsAppUrl } from '@/shared/lib/whatsapp';
import { ButtonPagination } from '@/shared/ui/Pagination';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/States';
import { WhatsAppIcon } from '@/shared/ui/WhatsAppIcon';
import type { Customer } from '../adapters/customer.adapter';
import { customersService } from '../services/customers.service';

export function CustomersList() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['admin', 'customers', { q, page }],
    queryFn: () => customersService.list({ q: q || undefined, page, pageSize: 20 }),
    placeholderData: keepPreviousData,
  });

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Cliente',
      cell: (c) => (
        <div>
          <p className="font-medium">{c.name}</p>
          {c.email ? <p className="text-xs text-slate-500">{c.email}</p> : null}
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Teléfono',
      cell: (c) => (
        <a href={buildWhatsAppUrl(c.phone, `Hola ${c.name}`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-slate-700 hover:text-[#1ebe5b]">
          <WhatsAppIcon className="h-3.5 w-3.5" /> {c.phone}
        </a>
      ),
    },
    { key: 'city', header: 'Ciudad', cell: (c) => c.city },
    {
      key: 'orders',
      header: 'Pedidos',
      className: 'text-right',
      cell: (c) => (
        <Link href={`/admin/pedidos?q=${encodeURIComponent(c.phone)}`} className="text-brand hover:underline">
          {c.ordersCount}
        </Link>
      ),
    },
    { key: 'spent', header: 'Total comprado', className: 'text-right', cell: (c) => <span className="font-medium">{formatCOP(c.totalSpent)}</span> },
    { key: 'last', header: 'Último pedido', cell: (c) => <span className="text-slate-600">{formatDate(c.lastOrderAt)}</span> },
  ];

  return (
    <div>
      <PageHeader title="Clientes" description="Construido a partir de los pedidos (agrupados por teléfono)." />
      <div className="mb-4">
        <SearchInput
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
          placeholder="Nombre, correo o teléfono"
        />
      </div>
      {query.isPending ? (
        <LoadingState label="Cargando clientes…" />
      ) : query.isError ? (
        <ErrorState description={getErrorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : query.data.items.length === 0 ? (
        <EmptyState title="No hay clientes" description={q ? 'Prueba con otra búsqueda.' : 'Aparecerán cuando lleguen pedidos.'} />
      ) : (
        <>
          <DataTable caption="Clientes" columns={columns} rows={query.data.items} rowKey={(c) => c.phone} />
          <ButtonPagination className="mt-4" page={query.data.page} totalPages={query.data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
