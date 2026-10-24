'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { ORDER_STATUS_LABELS } from '@/features/orders/adapters/order.adapter';
import { getErrorMessage } from '@/shared/api/errors';
import { formatDateTime } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { Textarea } from '@/shared/ui/Input';
import type { AdminOrderDetail, AdminOrderEvent } from '../adapters/admin-order.adapter';
import { useAddOrderNote } from '../hooks/useOrders';

export function describeEvent(e: AdminOrderEvent): string {
  if (e.type === 'created') return 'Pedido creado';
  if (e.type === 'status_change' && e.toStatus) {
    return e.fromStatus
      ? `${ORDER_STATUS_LABELS[e.fromStatus]} → ${ORDER_STATUS_LABELS[e.toStatus]}`
      : `Estado: ${ORDER_STATUS_LABELS[e.toStatus]}`;
  }
  return 'Nota interna';
}

/** Historial del pedido + formulario de nota interna. */
export function OrderNotes({ order }: { order: AdminOrderDetail }) {
  const add = useAddOrderNote(order.id);
  const [note, setNote] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    const text = note.trim();
    if (!text) return;
    add.mutate(text, {
      onSuccess: () => {
        setNote('');
        toast.success('Nota agregada.');
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  }

  return (
    <div className="space-y-4">
      <ol className="space-y-3">
        {order.events.map((e) => (
          <li key={e.id || e.createdAt} className="border-l-2 border-slate-200 pl-3">
            <p className="text-sm font-medium text-slate-800">{describeEvent(e)}</p>
            {e.note ? <p className="whitespace-pre-line text-sm text-slate-600">{e.note}</p> : null}
            <p className="text-xs text-slate-400">
              {formatDateTime(e.createdAt)}
              {e.userName ? ` · ${e.userName}` : ''}
            </p>
          </li>
        ))}
      </ol>
      <form onSubmit={submit} className="space-y-2 no-print">
        <label htmlFor="order-note" className="text-sm font-medium text-slate-700">
          Agregar nota interna
        </label>
        <Textarea id="order-note" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Solo visible para el equipo" />
        <Button type="submit" size="sm" variant="outline" loading={add.isPending} disabled={!note.trim()}>
          Guardar nota
        </Button>
      </form>
    </div>
  );
}
