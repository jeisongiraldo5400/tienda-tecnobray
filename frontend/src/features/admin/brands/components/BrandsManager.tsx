'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ActiveBadge } from '@/features/admin/shell/components/ActiveBadge';
import { DataTable, type Column } from '@/features/admin/shell/components/DataTable';
import { PageHeader } from '@/features/admin/shell/components/PageHeader';
import { QueryStates } from '@/features/admin/shell/components/QueryStates';
import { getErrorMessage } from '@/shared/api/errors';
import { Button, buttonClasses } from '@/shared/ui/Button';
import { useConfirm } from '@/shared/ui/ConfirmDialog';
import { RemoteImage } from '@/shared/ui/RemoteImage';
import { EmptyState } from '@/shared/ui/States';
import type { AdminBrand } from '../adapters/brand.adapter';
import { useAdminBrands, useDeleteBrand } from '../hooks/useBrands';
import { BrandFormModal } from './BrandFormModal';

export function BrandsManager() {
  const query = useAdminBrands();
  const remove = useDeleteBrand();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<AdminBrand | 'new' | null>(null);

  const columns: Column<AdminBrand>[] = [
    {
      key: 'name',
      header: 'Marca',
      cell: (b) => (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-white">
            <RemoteImage src={b.logoUrl} alt="" fill sizes="64px" className="object-contain p-1" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{b.name}</p>
            <p className="text-xs text-slate-500">/{b.slug}</p>
          </div>
        </div>
      ),
    },
    { key: 'products', header: 'Productos', className: 'text-right', cell: (b) => b.productCount },
    { key: 'active', header: 'Estado', cell: (b) => <ActiveBadge active={b.active} on="Activa" off="Inactiva" /> },
    {
      key: 'actions',
      header: <span className="sr-only">Acciones</span>,
      className: 'text-right',
      cell: (b) => (
        <div className="flex justify-end gap-1">
          <button type="button" className={buttonClasses('ghost', 'icon')} onClick={() => setEditing(b)} aria-label={`Editar ${b.name}`}>
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={buttonClasses('ghost', 'icon', 'text-red-600 hover:bg-red-50')}
            aria-label={`Eliminar ${b.name}`}
            onClick={async () => {
              if (await confirm({ title: `¿Eliminar la marca “${b.name}”?` })) {
                remove.mutate(b.id, { onSuccess: () => toast.success('Marca eliminada.'), onError: (e) => toast.error(getErrorMessage(e)) });
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Marcas"
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Nueva marca
          </Button>
        }
      />
      <QueryStates query={query} loadingLabel="Cargando marcas…">
        {(list) =>
          list.length === 0 ? (
            <EmptyState title="Aún no hay marcas" action={<Button onClick={() => setEditing('new')}>Crear marca</Button>} />
          ) : (
            <DataTable caption="Marcas" columns={columns} rows={list} rowKey={(b) => b.id} />
          )
        }
      </QueryStates>
      {editing ? <BrandFormModal open onClose={() => setEditing(null)} brand={editing === 'new' ? undefined : editing} /> : null}
    </div>
  );
}
