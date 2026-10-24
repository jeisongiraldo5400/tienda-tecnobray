'use client';

import { create } from 'zustand';
import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: 'danger' | 'primary';
}

interface ConfirmState {
  options: ConfirmOptions | null;
  resolve: ((value: boolean) => void) | null;
  ask: (options: ConfirmOptions) => Promise<boolean>;
  settle: (value: boolean) => void;
}

const useConfirmStore = create<ConfirmState>((set, get) => ({
  options: null,
  resolve: null,
  ask: (options) =>
    new Promise<boolean>((resolve) => {
      get().resolve?.(false);
      set({ options, resolve });
    }),
  settle: (value) => {
    get().resolve?.(value);
    set({ options: null, resolve: null });
  },
}));

/** Devuelve `confirm(options) => Promise<boolean>` para acciones destructivas. */
export function useConfirm() {
  return useConfirmStore((s) => s.ask);
}

export function ConfirmDialogHost() {
  const options = useConfirmStore((s) => s.options);
  const settle = useConfirmStore((s) => s.settle);
  return (
    <Modal
      open={!!options}
      onClose={() => settle(false)}
      title={options?.title ?? ''}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={() => settle(false)}>
            {options?.cancelText ?? 'Cancelar'}
          </Button>
          <Button variant={options?.tone === 'primary' ? 'primary' : 'danger'} onClick={() => settle(true)}>
            {options?.confirmText ?? 'Eliminar'}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{options?.message ?? 'Esta acción no se puede deshacer.'}</p>
    </Modal>
  );
}
