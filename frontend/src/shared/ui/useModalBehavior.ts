'use client';

import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Comportamiento accesible de diálogos (Drawer, Modal, hoja inferior):
 * - mueve el foco al primer control del panel al abrir (o al panel);
 * - atrapa el foco: el resto de la página queda `inert` (ni foco, ni clics, ni lector de pantalla)
 *   y Tab/Shift+Tab ciclan dentro del panel;
 * - Escape cierra; al cerrar, el foco vuelve al elemento que abrió el diálogo;
 * - bloquea el scroll del body.
 * `containerRef` es el nodo del portal (hijo directo de <body>); `panelRef`, el panel con role="dialog".
 */
export function useModalBehavior(
  open: boolean,
  onClose: () => void,
  containerRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  initialFocusSelector = FOCUSABLE,
) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    const panel = panelRef.current;

    // Página de fondo inerte (los avisos de sonner siguen activos).
    // Se recorre desde el contenedor hasta <body> marcando los hermanos de cada nivel
    // (sirve tanto para portales como para diálogos renderizados dentro de la app).
    const madeInert: HTMLElement[] = [];
    let node: HTMLElement | null = container;
    while (node && node !== document.body && node.parentElement) {
      for (const el of Array.from(node.parentElement.children) as HTMLElement[]) {
        if (el === node || el.inert || el.tagName === 'SCRIPT') continue;
        if (el.matches('section[aria-label^="Notifications"], [data-sonner-toaster]') || el.querySelector('[data-sonner-toaster]')) continue;
        el.inert = true;
        madeInert.push(el);
      }
      node = node.parentElement;
    }

    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const first = panel?.querySelector<HTMLElement>(initialFocusSelector);
    (first ?? panel)?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const firstItem = items[0]!;
      const lastItem = items[items.length - 1]!;
      if (e.shiftKey && (document.activeElement === firstItem || document.activeElement === panel)) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      for (const el of madeInert) el.inert = false;
      document.body.style.overflow = overflow;
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, [open, containerRef, panelRef, initialFocusSelector]);
}
