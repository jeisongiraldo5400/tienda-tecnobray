'use client';

import { useMutation } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { Form, Formik } from 'formik';
import { useSearchParams } from 'next/navigation';
import * as Yup from 'yup';
import { isValidColombianPhone, normalizeColombianPhone } from '@/features/checkout/adapters/checkout.schema';
import { trackOrder } from '@/features/checkout/services/checkout.service';
import { ApiError, getErrorMessage } from '@/shared/api/errors';
import { formatCOP, formatDate } from '@/shared/lib/format';
import type { Order } from '@/shared/types/domain';
import { Button } from '@/shared/ui/Button';
import { Card, CardBody } from '@/shared/ui/Card';
import { TextField } from '@/shared/ui/FormikFields';
import { ErrorState } from '@/shared/ui/States';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderTimeline } from './OrderTimeline';

const schema = Yup.object({
  number: Yup.string().trim().min(3, 'Número de pedido inválido.').max(40).required('Ingresa el número de pedido.'),
  phone: Yup.string()
    .trim()
    .required('Ingresa el celular del pedido.')
    .test('co-phone', 'Ingresa un celular válido de 10 dígitos.', isValidColombianPhone),
});

export function TrackingView() {
  const params = useSearchParams();
  const mutation = useMutation<Order, Error, { number: string; phone: string }>({
    mutationFn: ({ number, phone }) => trackOrder(number.trim().replace(/^#/, ''), normalizeColombianPhone(phone)),
  });
  const notFound = mutation.error instanceof ApiError && mutation.error.status === 404;

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6">
      <Card>
        <CardBody className="p-5 sm:p-7">
          <Formik
            initialValues={{ number: params.get('numero') ?? '', phone: '' }}
            validationSchema={schema}
            onSubmit={(values) => mutation.mutateAsync(values).catch(() => undefined)}
          >
            {/* Móvil: campos apilados. Desde sm: dos columnas alineadas (la línea de error está reservada)
                y el botón ocupa todo el ancho debajo, así nunca queda desalineado con los inputs. */}
            <Form noValidate className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
              <TextField name="number" label="Número de pedido" placeholder="Ej. TB-000123" autoComplete="off" required />
              <TextField name="phone" label="Celular" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="300 123 4567" required />
              <Button type="submit" size="lg" className="mt-2 w-full sm:col-span-2" loading={mutation.isPending}>
                Consultar
              </Button>
            </Form>
          </Formik>
          <p className="mt-4 flex items-start gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" aria-hidden="true" />
            Encuentras el número de pedido (TB-…) en la confirmación de tu compra y en el mensaje de WhatsApp que nos
            enviaste.
          </p>
        </CardBody>
      </Card>

      {mutation.isError ? (
        notFound ? (
          <ErrorState
            title="No encontramos el pedido"
            description="Verifica el número de pedido y el celular con el que lo realizaste."
          />
        ) : (
          <ErrorState description={getErrorMessage(mutation.error)} />
        )
      ) : null}

      {mutation.data ? <TrackingResult order={mutation.data} /> : null}
    </div>
  );
}

function TrackingResult({ order }: { order: Order }) {
  return (
    <Card>
      <CardBody className="space-y-6 p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Pedido</p>
            <p className="text-xl font-bold text-slate-900">#{order.number}</p>
            {order.createdAt ? <p className="text-xs text-slate-500">Realizado el {formatDate(order.createdAt)}</p> : null}
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <OrderTimeline order={order} />
        <div className="border-t border-slate-100 pt-4">
          <ul className="space-y-2 text-sm">
            {order.items.map((i) => (
              <li key={`${i.productId}-${i.name}`} className="flex justify-between gap-3">
                <span className="min-w-0 text-slate-600">
                  {i.quantity} × {i.name}
                </span>
                <span className="shrink-0 tabular-nums">{formatCOP(i.subtotal)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900">
            <span>Total</span>
            <span>{formatCOP(order.total)}</span>
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
