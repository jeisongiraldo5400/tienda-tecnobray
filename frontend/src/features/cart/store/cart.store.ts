import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Igual al tope del backend (MAX_QTY_PER_ITEM). */
export const MAX_QTY_PER_ITEM = 10;

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string;
  /** Stock conocido al agregar; limita la cantidad. */
  stock: number;
  quantity: number;
}

export type CartProductInput = Omit<CartItem, 'quantity'>;

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: CartProductInput, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  replaceItems: (items: CartItem[]) => void;
  open: () => void;
  close: () => void;
}

function maxFor(stock: number): number {
  return Math.max(0, Math.min(MAX_QTY_PER_ITEM, Math.floor(stock)));
}

function clampQty(quantity: number, stock: number): number {
  const q = Math.floor(Number.isFinite(quantity) ? quantity : 1);
  return Math.max(1, Math.min(q, Math.max(1, maxFor(stock))));
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      addItem: (product, quantity = 1) =>
        set((state) => {
          if (product.stock <= 0) return state;
          const existing = state.items.find((i) => i.productId === product.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product.productId
                  ? { ...i, ...product, quantity: clampQty(i.quantity + quantity, product.stock) }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { ...product, quantity: clampQty(quantity, product.stock) }] };
        }),
      removeItem: (productId) => set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) => (i.productId === productId ? { ...i, quantity: clampQty(quantity, i.stock) } : i)),
        })),
      clear: () => set({ items: [] }),
      replaceItems: (items) => set({ items }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: 'tecnobray-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export const selectCount = (s: { items: CartItem[] }) => s.items.reduce((acc, i) => acc + i.quantity, 0);
export const selectSubtotal = (s: { items: CartItem[] }) => s.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
export const selectSavings = (s: { items: CartItem[] }) =>
  s.items.reduce(
    (acc, i) => acc + (i.compareAtPrice && i.compareAtPrice > i.price ? (i.compareAtPrice - i.price) * i.quantity : 0),
    0,
  );
