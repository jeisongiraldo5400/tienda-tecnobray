'use client';

import { ImagePlus, Trash2 } from 'lucide-react';
import { useEffect, useId, useMemo } from 'react';
import { RemoteImage } from '@/shared/ui/RemoteImage';

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_MB = 5;

/** Valida tipo y tamaño en el cliente (el backend vuelve a validar por magic bytes). */
export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return `“${file.name}” no es JPG, PNG o WebP.`;
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `“${file.name}” supera ${MAX_IMAGE_MB} MB.`;
  return null;
}

/** URL temporal (blob:) para previsualizar un archivo local; se libera al cambiar. */
export function useObjectUrl(file: File | null): string | null {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
  return url;
}

/** Selector de una sola imagen con vista previa (logo, banner, categoría…). */
export function ImageInput({
  label,
  currentUrl,
  file,
  onFileChange,
  onRemoveCurrent,
  hint,
  aspect = 'aspect-video',
}: {
  label: string;
  currentUrl?: string | null;
  file: File | null;
  onFileChange: (file: File | null, error?: string) => void;
  onRemoveCurrent?: () => void;
  hint?: string;
  aspect?: string;
}) {
  const id = useId();
  const preview = useObjectUrl(file);
  const shown = preview ?? currentUrl ?? null;

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <div className={`relative ${aspect} w-full ${aspect.includes('max-w-') ? '' : 'max-w-sm'} overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50`}>
        {shown ? (
          preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:)
            <img src={preview} alt="Vista previa" className="h-full w-full object-contain" />
          ) : (
            <RemoteImage src={shown} alt={label} fill sizes="384px" className="object-contain" />
          )
        ) : (
          <label htmlFor={id} className="flex h-full cursor-pointer flex-col items-center justify-center gap-1 text-sm text-slate-500">
            <ImagePlus className="h-6 w-6" aria-hidden="true" />
            Seleccionar imagen
          </label>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={id} className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium hover:bg-slate-50 focus-within:ring-2 focus-within:ring-accent-text md:min-h-9 md:px-3">
          {shown ? 'Cambiar' : 'Subir'}
        </label>
        <input
          id={id}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            e.target.value = '';
            if (!f) return;
            const error = validateImageFile(f);
            onFileChange(error ? null : f, error ?? undefined);
          }}
        />
        {file ? (
          <button type="button" onClick={() => onFileChange(null)} className="min-h-11 px-2 text-sm text-slate-500 hover:text-slate-800 md:min-h-9">
            Descartar
          </button>
        ) : currentUrl && onRemoveCurrent ? (
          <button type="button" onClick={onRemoveCurrent} className="inline-flex min-h-11 items-center gap-1 px-2 text-sm text-red-600 hover:text-red-700 md:min-h-9">
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Quitar
          </button>
        ) : null}
      </div>
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
