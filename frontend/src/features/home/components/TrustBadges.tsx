import { CreditCard, MessageCircle, ShieldCheck, Truck } from 'lucide-react';

export function TrustBadges({ shippingText }: { shippingText?: string }) {
  const items = [
    { icon: Truck, title: 'Envíos a toda Colombia', text: shippingText ?? 'Recibe en la puerta de tu casa' },
    { icon: ShieldCheck, title: 'Garantía real', text: 'Productos originales con respaldo' },
    { icon: CreditCard, title: 'Pago contra entrega', text: 'Paga cuando recibas tu pedido' },
    { icon: MessageCircle, title: 'Atención por WhatsApp', text: 'Te asesoramos antes y después' },
  ];
  return (
    <section aria-label="Beneficios" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {items.map(({ icon: Icon, title, text }) => (
        <div key={title} className="flex flex-col items-start gap-2.5 rounded-2xl border border-slate-200 bg-white p-3.5 sm:flex-row sm:gap-3 sm:p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-accent">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm leading-5 font-semibold text-slate-900">{title}</p>
            <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-slate-500">{text}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
