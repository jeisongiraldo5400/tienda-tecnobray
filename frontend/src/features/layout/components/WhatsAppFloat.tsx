'use client';

import { usePathname } from 'next/navigation';
import { buildWhatsAppUrl } from '@/shared/lib/whatsapp';
import { useStoreSettings } from '@/features/settings/hooks/StoreSettingsProvider';
import { BRAND_INK } from '@/shared/config/brand';
import { WhatsAppIcon } from '@/shared/ui/WhatsAppIcon';

const WHATSAPP_GREEN = '#25D366';

export function WhatsAppFloat() {
  const settings = useStoreSettings();
  const pathname = usePathname();
  const number = settings.contact.whatsapp;
  // En el checkout no se muestra: taparía el botón "Confirmar pedido" en móvil y distrae de completar el pedido.
  // En la confirmación tampoco: allí la tarjeta "Siguiente paso" ya tiene el botón grande de WhatsApp.
  if (!number || pathname === '/checkout' || pathname === '/pedido/confirmacion') return null;
  return (
    <a
      href={buildWhatsAppUrl(number, `¡Hola ${settings.storeName}! Quiero más información.`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      // Verde oficial + texto marino (8.3:1) fijos en línea: el mismo fondo sólido en toda la página,
      // también sobre el footer oscuro (sin cambio de fondo al pasar el mouse ni capas encima del ícono).
      // Respeta el área segura y sube cuando hay una barra fija de compra (html[data-sticky-cta]).
      style={{ backgroundColor: WHATSAPP_GREEN, color: BRAND_INK, colorScheme: 'light', forcedColorAdjust: 'none' }}
      className={
        'no-print fixed right-4 bottom-[max(1rem,calc(var(--safe-bottom)+0.75rem))] z-40 isolate flex items-center gap-2.5 ' +
        'rounded-full p-3 opacity-100 shadow-xl ring-4 ring-white transition-[transform,bottom] ' +
        'hover:scale-105 focus-visible:outline-none focus-visible:ring-accent-text sm:right-5 sm:bottom-5 sm:pr-5 ' +
        '[html[data-sticky-cta]_&]:bottom-[calc(var(--safe-bottom)+5.75rem)] md:[html[data-sticky-cta]_&]:bottom-5'
      }
    >
      <WhatsAppIcon className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
      <span className="hidden text-base font-semibold sm:block">¿Dudas? Escríbenos</span>
    </a>
  );
}
