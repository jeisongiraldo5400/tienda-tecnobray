import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Etiqueta en la vista de tarjetas (móvil). Por defecto, el `header` si es texto. */
  mobileLabel?: string;
}

/**
 * Tabla del panel. Móvil primero: en teléfonos cada fila se muestra como tarjeta (primera columna como
 * título, el resto como pares etiqueta/valor y las acciones al pie). Desde md es una tabla normal que,
 * si no cabe, se desplaza horizontalmente dentro de su contenedor (nunca la página).
 * Es un único DOM (CSS), así que no se duplican textos ni controles.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption: string;
}) {
  return (
    <div className="md:overflow-x-auto md:rounded-2xl md:border md:border-slate-200 md:bg-white">
      <table className="w-full text-sm max-md:block md:min-w-[640px]">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-slate-50 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase max-md:sr-only">
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cn('px-4 py-3 whitespace-nowrap', c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="max-md:block max-md:space-y-3 md:divide-y md:divide-slate-100">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="max-md:block max-md:rounded-2xl max-md:border max-md:border-slate-200 max-md:bg-white max-md:p-4 max-md:shadow-sm md:hover:bg-slate-50/60"
            >
              {columns.map((c, i) => {
                const label = c.mobileLabel ?? (typeof c.header === 'string' ? c.header : undefined);
                const first = i === 0;
                return (
                  <td
                    key={c.key}
                    data-label={!first && label ? label : undefined}
                    className={cn(
                      'px-4 py-3 align-middle',
                      c.className,
                      // Vista de tarjeta (móvil): primera columna = título; el resto, etiqueta/valor; sin etiqueta = acciones.
                      first
                        ? 'max-md:mb-2 max-md:block max-md:border-b max-md:border-slate-100 max-md:px-0 max-md:pt-0 max-md:pb-3 max-md:text-left'
                        : label
                          ? 'max-md:flex max-md:min-h-9 max-md:items-center max-md:justify-between max-md:gap-4 max-md:px-0 max-md:py-1 max-md:text-right max-md:before:shrink-0 max-md:before:text-left max-md:before:text-xs max-md:before:font-medium max-md:before:text-slate-500 max-md:before:content-[attr(data-label)]'
                          : 'max-md:mt-2 max-md:flex max-md:items-center max-md:justify-end max-md:border-t max-md:border-slate-100 max-md:px-0 max-md:pt-2 max-md:pb-0',
                    )}
                  >
                    {c.cell(row)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
