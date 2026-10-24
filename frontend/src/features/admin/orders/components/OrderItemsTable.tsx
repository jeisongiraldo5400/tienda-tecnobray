import { formatCOP } from '@/shared/lib/format';
import type { Order } from '@/shared/types/domain';
import { RemoteImage } from '@/shared/ui/RemoteImage';

export function OrderItemsTable({ order, showImages = true }: { order: Order; showImages?: boolean }) {
  return (
    <table className="w-full min-w-[420px] text-sm">
      <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
        <tr>
          <th scope="col" className="py-2">Producto</th>
          <th scope="col" className="py-2 pl-3 text-right whitespace-nowrap">Precio</th>
          <th scope="col" className="py-2 pl-3 text-right whitespace-nowrap">Cant.</th>
          <th scope="col" className="py-2 pl-3 text-right whitespace-nowrap">Total</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {order.items.map((i, idx) => (
          <tr key={`${i.productId}-${idx}`}>
            <td className="py-2">
              <div className="flex items-center gap-3">
                {showImages ? (
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border border-slate-100 bg-white">
                    <RemoteImage src={i.imageUrl} alt="" fill sizes="40px" className="object-contain" />
                  </div>
                ) : null}
                <div>
                  <p className="font-medium">{i.name}</p>
                  {i.sku ? <p className="text-xs text-slate-500">SKU {i.sku}</p> : null}
                </div>
              </div>
            </td>
            <td className="py-2 pl-3 text-right whitespace-nowrap tabular-nums">{formatCOP(i.unitPrice)}</td>
            <td className="py-2 pl-3 text-right whitespace-nowrap tabular-nums">{i.quantity}</td>
            <td className="py-2 pl-3 text-right font-medium whitespace-nowrap tabular-nums">{formatCOP(i.subtotal)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot className="text-sm">
        <tr>
          <td colSpan={3} className="pt-3 text-right text-slate-500">Subtotal</td>
          <td className="pt-3 text-right">{formatCOP(order.subtotal)}</td>
        </tr>
        {order.shippingCost > 0 ? (
          <tr>
            <td colSpan={3} className="text-right text-slate-500">Envío</td>
            <td className="text-right">{formatCOP(order.shippingCost)}</td>
          </tr>
        ) : null}
        <tr>
          <td colSpan={3} className="pt-1 text-right font-bold">Total</td>
          <td className="pt-1 text-right text-base font-bold">{formatCOP(order.total)}</td>
        </tr>
      </tfoot>
    </table>
  );
}
