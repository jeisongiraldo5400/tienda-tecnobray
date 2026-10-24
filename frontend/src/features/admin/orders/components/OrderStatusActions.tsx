'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ORDER_STATUS_LABELS } from '@/features/orders/adapters/order.adapter';
import { getErrorMessage } from '@/shared/api/errors';
import type { OrderStatus } from '@/shared/types/domain';
import { Button } from '@/shared/ui/Button';
import { Textarea } from '@/shared/ui/Input';
import { Modal } from '@/shared/ui/Modal';
import type { AdminOrderDetail } from '../adapters/admin-order.adapter';
import { useChangeOrderStatus } from '../hooks/useOrders';

const HINTS: Partial<Record<OrderStatus, string>> = {
  confirmado: 'Al confirmar se descuenta el stock de los productos.',
  cancelado: 'Si el stock ya se había descontado, se repone automáticamente.',
  enviado: 'Puedes agregar la guía o transportadora en la nota.',
};

/** Botones de transición permitidos (según allowedTransitions del backend) con nota opcional. */
export function OrderStatusActions({ order }: { order: AdminOrderDetail }) {
  const change = useChangeOrderStatus(order.id);
  const [target, setTarget] = useState<OrderStatus | null>(null);
  const [note, setNote] = useState('');

  if (order.allowedTransitions.length === 0) {
    return <p className="text-sm text-slate-500">Este pedido está en un estado final.</p>;
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {order.allowedTransitions.map((s) => (
          <Button key={s} variant={s === 'cancelado' ? 'outline' : 'primary'} className={s === 'cancelado' ? 'text-red-600 max-sm:w-full' : 'max-sm:w-full'} onClick={() => setTarget(s)}>
            {s === 'cancelado' ? 'Cancelar pedido' : `Marcar como ${ORDER_STATUS_LABELS[s].toLowerCase()}`}
          </Button>
        ))}
      </div>
      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        title={target ? `Cambiar a “${ORDER_STATUS_LABELS[target]}”` : ''}
        description={target ? HINTS[target] : undefined}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Volver
            </Button>
            <Button
              variant={target === 'cancelado' ? 'danger' : 'primary'}
              loading={change.isPending}
              onClick={() => {
                if (!target) return;
                change.mutate(
                  { status: target, note: note.trim() || undefined },
                  {
                    onSuccess: () => {
                      toast.success(`Pedido marcado como ${ORDER_STATUS_LABELS[target].toLowerCase()}.`);
                      setTarget(null);
                      setNote('');
                    },
                    onError: (e) => toast.error(getErrorMessage(e)),
                  },
                );
              }}
            >
              Confirmar
            </Button>
          </>
        }
      >
        <label className="block text-sm font-medium text-slate-700" htmlFor="status-note">
          Nota (opcional)
        </label>
        <Textarea id="status-note" className="mt-1.5" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej. Enviado por Servientrega, guía 123456" />
      </Modal>
    </>
  );
}
