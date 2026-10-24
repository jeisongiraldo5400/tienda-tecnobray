'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** true solo en el cliente (evita desajustes de hidratación con el carrito persistido). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
