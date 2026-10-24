'use client';

import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2 } from 'lucide-react';
import { useId, useState, type DragEvent } from 'react';
import { toast } from 'sonner';
import { ACCEPTED_IMAGE_TYPES } from '@/features/admin/shell/components/ImageInput';
import { getErrorMessage } from '@/shared/api/errors';
import { cn } from '@/shared/lib/cn';
import { useConfirm } from '@/shared/ui/ConfirmDialog';
import { RemoteImage } from '@/shared/ui/RemoteImage';
import { Spinner } from '@/shared/ui/Spinner';
import type { AdminProductImage } from '../adapters/product.adapter';
import { useProductImages } from '../hooks/useProducts';
import { acceptImageFiles } from './PendingImagesPicker';

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

/** Galería de un producto existente: subir varias, reordenar (arrastrar o flechas), principal, alt y eliminar. */
export function ProductImagesManager({ productId, images }: { productId: string; images: AdminProductImage[] }) {
  const inputId = useId();
  const { upload, reorder, update, remove } = useProductImages(productId);
  const confirm = useConfirm();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const busy = upload.isPending || reorder.isPending || update.isPending || remove.isPending;

  const onError = (e: unknown) => toast.error(getErrorMessage(e));

  function handleFiles(list: FileList | null) {
    if (!list) return;
    const files = acceptImageFiles(list);
    if (files.length === 0) return;
    upload.mutate(files, {
      onSuccess: () => toast.success(files.length === 1 ? 'Imagen subida.' : `${files.length} imágenes subidas.`),
      onError,
    });
  }

  function applyOrder(next: AdminProductImage[]) {
    reorder.mutate(next.map((i) => i.id), { onError });
  }

  function onDrop(e: DragEvent, to: number) {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== to) applyOrder(moveItem(images, dragIndex, to));
    setDragIndex(null);
  }

  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="Imágenes del producto">
        {images.map((img, i) => (
          <li
            key={img.id}
            draggable={!busy}
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, i)}
            className={cn(
              'group relative overflow-hidden rounded-xl border-2 bg-white',
              img.isMain ? 'border-brand' : 'border-slate-200',
              dragIndex === i && 'opacity-50',
            )}
          >
            <div className="relative aspect-square cursor-grab">
              <RemoteImage src={img.thumbUrl || img.url} alt={img.alt || `Imagen ${i + 1}`} fill sizes="200px" className="object-contain p-1" />
            </div>
            {img.isMain ? (
              <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">
                <Star className="h-3 w-3" aria-hidden="true" /> Principal
              </span>
            ) : null}
            <div className="flex items-center justify-between gap-1 border-t border-slate-100 p-1">
              <div className="flex">
                <button type="button" disabled={busy || i === 0} onClick={() => applyOrder(moveItem(images, i, i - 1))} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label="Mover a la izquierda">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button type="button" disabled={busy || i === images.length - 1} onClick={() => applyOrder(moveItem(images, i, i + 1))} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label="Mover a la derecha">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="flex">
                {!img.isMain ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => update.mutate({ imageId: img.id, data: { isMain: true } }, { onSuccess: () => toast.success('Imagen principal actualizada.'), onError })}
                    className="rounded p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-30"
                    aria-label="Marcar como principal"
                    title="Marcar como principal"
                  >
                    <Star className="h-4 w-4" />
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    if (await confirm({ title: '¿Eliminar imagen?', message: 'La imagen se borrará del almacenamiento.' })) {
                      remove.mutate(img.id, { onSuccess: () => toast.success('Imagen eliminada.'), onError });
                    }
                  }}
                  className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                  aria-label="Eliminar imagen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <label className="block border-t border-slate-100 p-1">
              <span className="sr-only">Texto alternativo de la imagen {i + 1}</span>
              <input
                defaultValue={img.alt}
                placeholder="Texto alternativo"
                maxLength={200}
                onBlur={(e) => {
                  const alt = e.target.value.trim();
                  if (alt !== img.alt) update.mutate({ imageId: img.id, data: { alt } }, { onError });
                }}
                className="w-full rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </label>
          </li>
        ))}
        <li>
          <label
            htmlFor={inputId}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
            }}
            className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-center text-xs text-slate-500 hover:border-brand hover:text-brand"
          >
            {upload.isPending ? <Spinner /> : <ImagePlus className="h-6 w-6" aria-hidden="true" />}
            {upload.isPending ? 'Subiendo…' : 'Subir o arrastrar imágenes'}
          </label>
          <input
            id={inputId}
            type="file"
            multiple
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </li>
      </ul>
      <p className="text-xs text-slate-500">
        Arrastra para reordenar. La imagen principal se muestra en el catálogo. JPG, PNG o WebP hasta 5 MB (máx. 10 por carga).
      </p>
    </div>
  );
}
