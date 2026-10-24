'use client';

import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { useStoreSettings } from '@/features/settings/hooks/StoreSettingsProvider';
import { formatCOP } from '@/shared/lib/format';
import { buildWhatsAppUrl } from '@/shared/lib/whatsapp';
import type { Order } from '@/shared/types/domain';
import { buttonClasses } from '@/shared/ui/Button';
import { Card, CardBody } from '@/shared/ui/Card';
import { WhatsAppIcon } from '@/shared/ui/WhatsAppIcon';
import { buildOrderWhatsAppMessage } from '../adapters/order-request';
import { readLastOrder } from '../store/last-order';

const noop = () => () => {};

export function ConfirmationView({ number }: { number: string }) {
  const settings = useStoreSettings();
  const raw = useSyncExternalStore(
    noop,
    () => JSON.stringify(readLastOrder(number)),
    () => 'null',
  );
  const order = JSON.parse(raw) as Order | null;
  const message = order
    ? buildOrderWhatsAppMessage(order, settings.storeName)
    : `¡Hola ${settings.storeName}! Acabo de hacer el pedido #${number}.`;
  const waUrl = order?.whatsappUrl ?? buildWhatsAppUrl(settings.contact.whatsapp, message);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft">
          <CheckCircle2 className="h-10 w-10 text-accent-text" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">¡Gracias por tu compra!</h1>
        <p className="mt-2 text-slate-600">Recibimos tu pedido y te contactaremos pronto para confirmarlo.</p>
        <p className="mt-4 inline-block rounded-xl border border-brand/10 bg-brand-soft px-4 py-2 text-lg font-bold text-brand">
          Pedido #{number}
        </p>
      </div>

      <Card className="border-2 border-whatsapp/50 bg-whatsapp/10 shadow-md">
        <CardBody className="space-y-3 p-5 text-center sm:p-6">
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Siguiente paso: confírmalo por WhatsApp</h2>
          <p className="mx-auto max-w-md text-sm text-slate-700">
            No hacemos cobros en línea. Envíanos tu pedido por WhatsApp y te confirmamos la disponibilidad, las formas
            de pago y el envío.
          </p>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses('whatsapp', 'lg', 'w-full shadow-lg sm:h-14 sm:text-lg')}
          >
            <WhatsAppIcon className="h-7 w-7 shrink-0" /> Enviar pedido por WhatsApp
          </a>
        </CardBody>
      </Card>

      {order ? (
        <Card>
          <CardBody className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900">Resumen</h2>
            <ul className="divide-y divide-slate-100 text-sm">
              {order.items.map((i) => (
                <li key={`${i.productId}-${i.name}`} className="flex justify-between gap-3 py-2">
                  <span className="text-slate-700">
                    {i.quantity} × {i.name}
                  </span>
                  <span className="font-medium">{formatCOP(i.subtotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1 border-t border-slate-100 pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal</dt>
                <dd>{formatCOP(order.subtotal)}</dd>
              </div>
              {order.shippingCost > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Envío</dt>
                  <dd>{formatCOP(order.shippingCost)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between text-base font-bold">
                <dt>Total</dt>
                <dd>{formatCOP(order.total)}</dd>
              </div>
            </dl>
            <p className="text-sm text-slate-500">
              Entrega: {order.customer.address}, {order.customer.city}
            </p>
          </CardBody>
        </Card>
      ) : null}

      <div className="space-y-3 text-center">
        <p className="text-sm text-slate-500">
          Guarda tu número de pedido. Lo necesitarás junto con tu celular para consultar el estado.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href={`/seguimiento?numero=${encodeURIComponent(number)}`} className={buttonClasses('outline', 'lg', 'w-full sm:w-auto')}>
            Rastrear mi pedido
          </Link>
          <Link href="/productos" className={buttonClasses('ghost', 'lg', 'w-full sm:w-auto')}>
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
