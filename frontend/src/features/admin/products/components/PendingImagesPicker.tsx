'use client';

import { ImagePlus, Star, X } from 'lucide-react';
import { useEffect, useId, useMemo } from 'react';
import { toast } from 'sonner';
import { ACCEPTED_IMAGE_TYPES, validateImageFile } from '@/features/admin/shell/components/ImageInput';
import { cn } from '@/shared/lib/cn';

export const MAX_FILES_PER_UPLOAD = 10;

/** Filtra archivos inválidos y avisa con toasts. */
export function acceptImageFiles(list: FileList | File[], already = 0): File[] {
  const out: File[] = [];
  for (const file of Array.from(list)) {
    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      continue;
    }
    if (already + out.length >= MAX_FILES_PER_UPLOAD) {
      toast.warning(`Máximo ${MAX_FILES_PER_UPLOAD} imágenes por carga.`);
      break;
    }
    out.push(file);
  }
  return out;
}

/** Imágenes en cola para un producto nuevo (se suben al crear). La primera será la principal. */
export function PendingImagesPicker({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  const id = useId();
  const previews = useMemo(() => files.map((f) => ({ file: f, url: URL.createObjectURL(f) })), [files]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {previews.map((p, i) => (
          <li key={`${p.file.name}-${i}`} className={cn('relative aspect-square overflow-hidden rounded-xl border-2 bg-white', i === 0 ? 'border-brand' : 'border-slate-200')}>
            {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:) */}
            <img src={p.url} alt={`Vista previa ${i + 1}`} className="h-full w-full object-contain p-1" />
            {i === 0 ? (
              <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">
                <Star className="h-3 w-3" aria-hidden="true" /> Principal
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => onChange(files.filter((_, j) => j !== i))}
              className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-slate-600 shadow hover:text-red-600"
              aria-label={`Quitar imagen ${i + 1}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
        <li>
          <label htmlFor={id} className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-xs text-slate-500 hover:border-brand hover:text-brand">
            <ImagePlus className="h-6 w-6" aria-hidden="true" />
            Agregar
          </label>
          <input
            id={id}
            type="file"
            multiple
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) onChange([...files, ...acceptImageFiles(e.target.files, files.length)]);
              e.target.value = '';
            }}
          />
        </li>
      </ul>
      <p className="text-xs text-slate-500">JPG, PNG o WebP de hasta 5 MB. Se suben al guardar el producto.</p>
    </div>
  );
}
