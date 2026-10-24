'use client';

import { FieldArray, useFormikContext } from 'formik';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/FormikFields';
import type { ProductFormValues } from '../adapters/product.adapter';

/** Editor de especificaciones clave/valor (Formik FieldArray). */
export function SpecsEditor() {
  const { values } = useFormikContext<ProductFormValues>();
  return (
    <FieldArray name="specs">
      {(helpers) => (
        <div className="space-y-3">
          {values.specs.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no hay especificaciones. Ej.: Pantalla → 6,5&quot; AMOLED.</p>
          ) : null}
          {values.specs.map((_, i) => (
            <div key={i} className="grid grid-cols-[1fr_1.5fr_auto] items-start gap-2">
              <TextField name={`specs.${i}.key`} label={`Nombre ${i + 1}`} placeholder="Pantalla" />
              <TextField name={`specs.${i}.value`} label={`Valor ${i + 1}`} placeholder='6,5" AMOLED 120 Hz' />
              <div className="mt-6.5 flex gap-1">
                <Button variant="ghost" size="icon" className="h-10 w-8" disabled={i === 0} onClick={() => helpers.swap(i, i - 1)} aria-label="Subir">
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-8"
                  disabled={i === values.specs.length - 1}
                  onClick={() => helpers.swap(i, i + 1)}
                  aria-label="Bajar"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-8 text-red-600" onClick={() => helpers.remove(i)} aria-label={`Eliminar especificación ${i + 1}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => helpers.push({ key: '', value: '' })} disabled={values.specs.length >= 40}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Agregar especificación
          </Button>
        </div>
      )}
    </FieldArray>
  );
}
