'use client';

import { Form, Formik, useField } from 'formik';
import Link from 'next/link';
import { getErrorMessage } from '@/shared/api/errors';
import { formatCOP } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { TextAreaField, TextField } from '@/shared/ui/FormikFields';
import { checkoutSchema, COLOMBIAN_CITIES, initialCheckoutValues, type CheckoutValues } from '../adapters/checkout.schema';

function TermsCheckbox() {
  const [field, meta] = useField<boolean>({ name: 'acceptTerms', type: 'checkbox' });
  const error = meta.touched && meta.error;
  return (
    <div>
      <label className="flex items-start gap-3 text-sm leading-6 text-slate-600">
        <input
          type="checkbox"
          name={field.name}
          checked={!!field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 accent-[var(--brand-accent-text)]" />
        <span>
          Acepto los{' '}
          <Link href="/politicas/terminos" target="_blank" className="font-medium text-brand underline">
            términos y condiciones
          </Link>{' '}
          y la{' '}
          <Link href="/politicas/privacidad" target="_blank" className="font-medium text-brand underline">
            política de tratamiento de datos
          </Link>
          .
        </span>
      </label>
      {error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-red-600">
          {meta.error}
        </p>
      ) : null}
    </div>
  );
}

export interface CheckoutFormProps {
  onSubmit: (values: CheckoutValues) => Promise<unknown> | void;
  submitting: boolean;
  error?: unknown;
  disabled?: boolean;
  /** Total estimado: se muestra junto al botón fijo en teléfonos. */
  total?: number;
}

export function CheckoutForm({ onSubmit, submitting, error, disabled, total }: CheckoutFormProps) {
  return (
    <Formik<CheckoutValues>
      initialValues={initialCheckoutValues}
      validationSchema={checkoutSchema}
      onSubmit={async (values) => {
        try {
          await onSubmit(values);
        } catch {
          /* el error se muestra desde la mutación */
        }
      }}
    >
      <Form noValidate className="space-y-5" aria-label="Datos de envío">
        <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
          <TextField name="name" label="Nombre completo" autoComplete="name" required className="sm:col-span-2" />
          <TextField name="phone" label="Celular" type="tel" inputMode="tel" autoComplete="tel" placeholder="300 123 4567" required hint="Te contactaremos por WhatsApp para confirmar." />
          <TextField name="email" label="Correo electrónico (opcional)" type="email" autoComplete="email" placeholder="tu@correo.com" />
          <TextField name="city" label="Ciudad" autoComplete="address-level2" list="co-cities" required />
          <TextField name="address" label="Dirección" autoComplete="street-address" placeholder="Calle 10 # 20-30, barrio, apto" required />
          <TextAreaField name="notes" label="Notas para la entrega (opcional)" rows={3} placeholder="Indicaciones, horario preferido, punto de referencia…" className="sm:col-span-2" />
        </div>
        <datalist id="co-cities">
          {COLOMBIAN_CITIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <TermsCheckbox />
        {error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {getErrorMessage(error, 'No pudimos crear tu pedido. Intenta de nuevo.')}
          </div>
        ) : null}
        {/* En teléfonos el total y el botón quedan fijos abajo mientras se llena el formulario. */}
        <div className="max-sm:pb-safe max-sm:sticky max-sm:bottom-0 max-sm:z-10 max-sm:-mx-5 max-sm:border-t max-sm:border-slate-200 max-sm:bg-white/95 max-sm:px-5 max-sm:pt-3 max-sm:backdrop-blur">
          {total !== undefined ? (
            <p className="mb-2 flex items-baseline justify-between text-sm sm:hidden">
              <span className="text-slate-600">Total estimado</span>
              <span className="text-lg font-bold text-slate-900 tabular-nums">{formatCOP(total)}</span>
            </p>
          ) : null}
          <Button type="submit" size="lg" variant="accent" className="w-full" loading={submitting} disabled={disabled}>
            {submitting ? 'Creando pedido…' : 'Confirmar pedido'}
          </Button>
        </div>
        <p className="text-center text-xs text-slate-500">
          Pagas contra entrega o por los medios que acordemos por WhatsApp. No se realiza ningún cobro en línea.
        </p>
      </Form>
    </Formik>
  );
}
