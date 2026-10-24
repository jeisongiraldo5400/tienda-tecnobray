'use client';

import { AlertTriangle, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useAdminBrands } from '@/features/admin/brands/hooks/useBrands';
import { sortAsTree } from '@/features/admin/categories/adapters/category.adapter';
import { useAdminCategories } from '@/features/admin/categories/hooks/useCategories';
import { DataTable, type Column } from '@/features/admin/shell/components/DataTable';
import { PageHeader } from '@/features/admin/shell/components/PageHeader';
import { SearchInput } from '@/features/admin/shell/components/SearchInput';
import { getErrorMessage } from '@/shared/api/errors';
import { formatCOP } from '@/shared/lib/format';
import { buttonClasses } from '@/shared/ui/Button';
import { useConfirm } from '@/shared/ui/ConfirmDialog';
import { Select } from '@/shared/ui/Input';
import { ButtonPagination } from '@/shared/ui/Pagination';
import { RemoteImage } from '@/shared/ui/RemoteImage';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/States';
import { Switch } from '@/shared/ui/Switch';
import type { AdminProduct } from '../adapters/product.adapter';
import { useAdminProducts, useDeleteProduct, useToggleProduct } from '../hooks/useProducts';
import type { AdminProductFilters } from '../services/products.service';

const PAGE_SIZE = 20;

/** Filtros del listado sincronizados con la URL (?q=&categoria=&marca=&estado=&pagina=). */
function useListFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filters: AdminProductFilters = useMemo(() => {
    const estado = params.get('estado');
    return {
      page: Number(params.get('pagina')) || 1,
      pageSize: PAGE_SIZE,
      q: params.get('q') || undefined,
      categoryId: params.get('categoria') || undefined,
      brandId: params.get('marca') || undefined,
      active: estado === 'activos' ? true : estado === 'inactivos' ? false : undefined,
      featured: estado === 'destacados' ? true : undefined,
      lowStock: estado === 'stock-bajo' ? true : undefined,
      sort: params.get('orden') || 'newest',
    };
  }, [params]);
  const set = useCallback(
    (patch: Record<string, string | undefined>) => {
      const sp = new URLSearchParams(params.toString());
      Object.entries(patch).forEach(([k, v]) => (v ? sp.set(k, v) : sp.delete(k)));
      if (!('pagina' in patch)) sp.delete('pagina');
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );
  return { filters, params, set };
}

export function ProductsList() {
  const { filters, params, set } = useListFilters();
  const query = useAdminProducts(filters);
  const categories = useAdminCategories();
  const brands = useAdminBrands();
  const remove = useDeleteProduct();
  const toggle = useToggleProduct();
  const confirm = useConfirm();

  const columns: Column<AdminProduct>[] = [
    {
      key: 'product',
      header: 'Producto',
      cell: (p) => (
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-white">
            <RemoteImage src={p.mainImageUrl} alt="" fill sizes="48px" className="object-contain" />
          </div>
          <div className="min-w-0">
            <Link href={`/admin/productos/${p.id}`} className="line-clamp-1 font-medium text-slate-900 hover:text-brand">
              {p.name}
            </Link>
            <p className="text-xs text-slate-500">
              SKU {p.sku}
              {p.featured ? (
                <span className="ml-2 inline-flex items-center gap-0.5 text-amber-600">
                  <Star className="h-3 w-3" aria-hidden="true" /> Destacado
                </span>
              ) : null}
            </p>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Categoría', cell: (p) => <span className="text-slate-600">{p.categoryName ?? '—'}</span> },
    {
      key: 'price',
      header: 'Precio',
      className: 'text-right',
      cell: (p) => (
        <div>
          <p className="font-medium">{formatCOP(p.price)}</p>
          {p.compareAtPrice ? <p className="text-xs text-slate-400 line-through">{formatCOP(p.compareAtPrice)}</p> : null}
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      className: 'text-right',
      cell: (p) => (
        <span className={p.stock <= 0 ? 'font-semibold text-red-600' : p.stock <= 5 ? 'font-semibold text-amber-600' : ''}>
          {p.stock <= 5 ? <AlertTriangle className="mr-1 inline h-3.5 w-3.5" aria-label="Stock bajo" /> : null}
          {p.stock}
        </span>
      ),
    },
    {
      key: 'active',
      header: 'Estado',
      cell: (p) => (
        <Switch
          id={`active-${p.id}`}
          checked={p.active}
          label={p.active ? 'Activo' : 'Inactivo'}
          disabled={toggle.isPending}
          onChange={(active) =>
            toggle.mutate(
              { id: p.id, data: { active } },
              {
                onSuccess: () => toast.success(active ? 'Producto activado.' : 'Producto desactivado.'),
                onError: (e) => toast.error(getErrorMessage(e)),
              },
            )
          }
        />
      ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Acciones</span>,
      className: 'text-right',
      cell: (p) => (
        <div className="flex justify-end gap-1">
          <Link href={`/admin/productos/${p.id}`} className={buttonClasses('ghost', 'icon')} aria-label={`Editar ${p.name}`}>
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            type="button"
            className={buttonClasses('ghost', 'icon', 'text-red-600 hover:bg-red-50')}
            aria-label={`Eliminar ${p.name}`}
            onClick={async () => {
              const ok = await confirm({
                title: `¿Eliminar “${p.name}”?`,
                message: 'Se eliminará el producto y sus imágenes. Esta acción no se puede deshacer.',
              });
              if (!ok) return;
              remove.mutate(p.id, {
                onSuccess: () => toast.success('Producto eliminado.'),
                onError: (e) => toast.error(getErrorMessage(e)),
              });
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
        title="Productos"
        description={query.data ? `${query.data.total} productos` : undefined}
        actions={
          <Link href="/admin/productos/nuevo" className={buttonClasses('primary')}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Nuevo producto
          </Link>
        }
      />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <SearchInput value={params.get('q') ?? ''} onChange={(q) => set({ q: q || undefined })} placeholder="Buscar por nombre o SKU" />
        <Select aria-label="Filtrar por categoría" className="sm:w-48" value={params.get('categoria') ?? ''} onChange={(e) => set({ categoria: e.target.value || undefined })}>
          <option value="">Todas las categorías</option>
          {sortAsTree(categories.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.depth ? '— ' : ''}
              {c.name}
            </option>
          ))}
        </Select>
        <Select aria-label="Filtrar por marca" className="sm:w-44" value={params.get('marca') ?? ''} onChange={(e) => set({ marca: e.target.value || undefined })}>
          <option value="">Todas las marcas</option>
          {(brands.data ?? []).map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
        <Select aria-label="Filtrar por estado" className="sm:w-40" value={params.get('estado') ?? ''} onChange={(e) => set({ estado: e.target.value || undefined })}>
          <option value="">Todos</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
          <option value="destacados">Destacados</option>
          <option value="stock-bajo">Stock bajo</option>
        </Select>
        <Select aria-label="Ordenar" className="sm:w-44" value={params.get('orden') ?? 'newest'} onChange={(e) => set({ orden: e.target.value })}>
          <option value="newest">Más recientes</option>
          <option value="oldest">Más antiguos</option>
          <option value="name">Nombre</option>
          <option value="price_asc">Precio ↑</option>
          <option value="price_desc">Precio ↓</option>
          <option value="stock_asc">Stock ↑</option>
        </Select>
      </div>

      {query.isPending ? (
        <LoadingState label="Cargando productos…" />
      ) : query.isError ? (
        <ErrorState description={getErrorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : query.data.items.length === 0 ? (
        <EmptyState
          title="No hay productos"
          description={params.toString() ? 'Prueba con otros filtros.' : 'Crea tu primer producto para empezar a vender.'}
          action={
            <Link href="/admin/productos/nuevo" className={buttonClasses('primary')}>
              Nuevo producto
            </Link>
          }
        />
      ) : (
        <div className={query.isPlaceholderData ? 'opacity-60 transition-opacity' : ''}>
          <DataTable caption="Listado de productos" columns={columns} rows={query.data.items} rowKey={(p) => p.id} />
          <ButtonPagination className="mt-4" page={query.data.page} totalPages={query.data.totalPages} onChange={(p) => set({ pagina: String(p) })} />
        </div>
      )}
    </div>
  );
}
