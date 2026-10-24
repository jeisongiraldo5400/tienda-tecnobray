'use client';

import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ActiveBadge } from '@/features/admin/shell/components/ActiveBadge';
import { PageHeader } from '@/features/admin/shell/components/PageHeader';
import { QueryStates } from '@/features/admin/shell/components/QueryStates';
import { getErrorMessage } from '@/shared/api/errors';
import { Button, buttonClasses } from '@/shared/ui/Button';
import { useConfirm } from '@/shared/ui/ConfirmDialog';
import { RemoteImage } from '@/shared/ui/RemoteImage';
import { EmptyState } from '@/shared/ui/States';
import type { AdminBanner } from '../adapters/banner.adapter';
import { useAdminBanners, useDeleteBanner, useUpdateBanner } from '../hooks/useBanners';
import { BannerFormModal } from './BannerFormModal';

export function BannersManager() {
  const query = useAdminBanners();
  const remove = useDeleteBanner();
  const update = useUpdateBanner();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<AdminBanner | 'new' | null>(null);

  /** Intercambia el orden de dos banners. */
  async function swap(list: AdminBanner[], i: number, j: number) {
    const a = list[i];
    const b = list[j];
    if (!a || !b) return;
    try {
      const orderA = a.sortOrder === b.sortOrder ? j : b.sortOrder;
      const orderB = a.sortOrder === b.sortOrder ? i : a.sortOrder;
      await Promise.all([update.mutateAsync({ id: a.id, data: { sortOrder: orderA } }), update.mutateAsync({ id: b.id, data: { sortOrder: orderB } })]);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  return (
    <div>
      <PageHeader
        title="Banners del inicio"
        description="Imágenes del slider principal de la tienda."
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Nuevo banner
          </Button>
        }
      />
      <QueryStates query={query} loadingLabel="Cargando banners…">
        {(list) =>
          list.length === 0 ? (
            <EmptyState title="No hay banners" description="Sin banners, el inicio muestra un encabezado por defecto." action={<Button onClick={() => setEditing('new')}>Crear banner</Button>} />
          ) : (
            <ul className="space-y-3">
              {list.map((b, i) => (
                <li key={b.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center">
                  <div className="relative aspect-[16/6] w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:w-60">
                    <RemoteImage src={b.imageUrl} alt={b.title} fill sizes="240px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{b.title}</p>
                    {b.text ? <p className="line-clamp-2 text-sm text-slate-500">{b.text}</p> : null}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <ActiveBadge active={b.active} />
                      {b.linkUrl ? <span className="truncate">→ {b.linkUrl}</span> : null}
                    </div>
                  </div>
                  <div className="flex gap-1 self-end sm:self-center">
                    <button type="button" disabled={i === 0 || update.isPending} onClick={() => swap(list, i, i - 1)} className={buttonClasses('ghost', 'icon')} aria-label="Subir">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button type="button" disabled={i === list.length - 1 || update.isPending} onClick={() => swap(list, i, i + 1)} className={buttonClasses('ghost', 'icon')} aria-label="Bajar">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setEditing(b)} className={buttonClasses('ghost', 'icon')} aria-label={`Editar ${b.title}`}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={buttonClasses('ghost', 'icon', 'text-red-600 hover:bg-red-50')}
                      aria-label={`Eliminar ${b.title}`}
                      onClick={async () => {
                        if (await confirm({ title: `¿Eliminar el banner “${b.title}”?` })) {
                          remove.mutate(b.id, { onSuccess: () => toast.success('Banner eliminado.'), onError: (e) => toast.error(getErrorMessage(e)) });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )
        }
      </QueryStates>
      {editing ? <BannerFormModal open onClose={() => setEditing(null)} banner={editing === 'new' ? undefined : editing} /> : null}
    </div>
  );
}
