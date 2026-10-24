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
import { sortAsTree, type AdminCategory } from '../adapters/category.adapter';
import { useAdminCategories, useDeleteCategory } from '../hooks/useCategories';
import { CategoryFormModal } from './CategoryFormModal';

export function CategoriesManager() {
  const query = useAdminCategories();
  const remove = useDeleteCategory();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<AdminCategory | 'new' | null>(null);

  const columns: Column<AdminCategory & { depth: number }>[] = [
    {
      key: 'name',
      header: 'Categoría',
      cell: (c) => (
        <div className={`flex items-center gap-3 ${c.depth ? 'pl-8' : ''}`}>
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
            <RemoteImage src={c.imageUrl} alt="" fill sizes="40px" className="object-cover" />
          </div>
          <div>
            <p className="font-medium text-slate-900">
              {c.depth ? '↳ ' : ''}
              {c.name}
            </p>
            <p className="text-xs text-slate-500">/{c.slug}</p>
          </div>
        </div>
      ),
    },
    { key: 'products', header: 'Productos', className: 'text-right', cell: (c) => c.productCount },
    { key: 'order', header: 'Orden', className: 'text-right', cell: (c) => c.sortOrder },
    { key: 'active', header: 'Estado', cell: (c) => <ActiveBadge active={c.active} on="Activa" off="Inactiva" /> },
    {
      key: 'actions',
      header: <span className="sr-only">Acciones</span>,
      className: 'text-right',
      cell: (c) => (
        <div className="flex justify-end gap-1">
          <button type="button" className={buttonClasses('ghost', 'icon')} onClick={() => setEditing(c)} aria-label={`Editar ${c.name}`}>
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={buttonClasses('ghost', 'icon', 'text-red-600 hover:bg-red-50')}
            aria-label={`Eliminar ${c.name}`}
            onClick={async () => {
              const ok = await confirm({
                title: `¿Eliminar “${c.name}”?`,
                message: c.productCount > 0 ? `Tiene ${c.productCount} productos asociados; quedarán sin categoría o el sistema impedirá eliminarla.` : 'Esta acción no se puede deshacer.',
              });
              if (ok) remove.mutate(c.id, { onSuccess: () => toast.success('Categoría eliminada.'), onError: (e) => toast.error(getErrorMessage(e)) });
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
        title="Categorías"
        description="Organiza el catálogo. Admite un nivel de subcategorías."
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Nueva categoría
          </Button>
        }
      />
      <QueryStates query={query} loadingLabel="Cargando categorías…">
        {(list) =>
          list.length === 0 ? (
            <EmptyState title="Aún no hay categorías" action={<Button onClick={() => setEditing('new')}>Crear categoría</Button>} />
          ) : (
            <DataTable caption="Categorías" columns={columns} rows={sortAsTree(list)} rowKey={(c) => c.id} />
          )
        }
      </QueryStates>
      {editing ? (
        <CategoryFormModal
          open
          onClose={() => setEditing(null)}
          category={editing === 'new' ? undefined : editing}
          categories={query.data ?? []}
        />
      ) : null}
    </div>
  );
}
