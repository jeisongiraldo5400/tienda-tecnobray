export interface ImageAsset {
  id?: string;
  url: string;
  thumbUrl?: string;
  alt: string;
  isMain?: boolean;
  position?: number;
}

export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface Category extends CategoryRef {
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
  productCount?: number;
  position?: number;
  isActive: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  isActive: boolean;
}

export interface ProductSpec {
  key: string;
  value: string;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  price: number;
  compareAtPrice?: number | null;
  /** Unidades que el cliente puede pedir (el backend expone min(stock, 10) como maxQuantity). */
  stock: number;
  inStock: boolean;
  shortDescription?: string;
  image?: ImageAsset;
  brand?: CategoryRef | null;
  category?: CategoryRef | null;
  isFeatured: boolean;
  isActive: boolean;
  createdAt?: string;
}

export interface Product extends ProductSummary {
  /** HTML sanitizado por el backend (descriptionHtml). */
  description?: string;
  images: ImageAsset[];
  specs: ProductSpec[];
  lowStockThreshold?: number;
  seoTitle?: string;
  seoDescription?: string;
  related?: ProductSummary[];
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  linkUrl?: string;
  buttonText?: string;
  position: number;
  isActive: boolean;
}

export interface PolicyPage {
  slug: string;
  title: string;
  content: string;
}

export interface StoreSettings {
  storeName: string;
  tagline?: string;
  logoUrl?: string;
  logoSmallUrl?: string;
  faviconUrl?: string;
  appleTouchIconUrl?: string;
  colors: { primary: string; secondary: string; accent: string };
  contact: {
    phone?: string;
    whatsapp?: string;
    email?: string;
    address?: string;
    city?: string;
    schedule?: string;
  };
  social: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    x?: string;
  };
  /** Texto corto para barra/insignias (primera línea de shippingInfo). */
  shippingText?: string;
  /** Texto completo de envíos (puede tener saltos de línea). */
  shippingInfo?: string;
  maxQuantityPerItem?: number;
  announcement?: string;
  seo: { title?: string; description?: string };
  policies: PolicyPage[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Estados del backend: nuevo → confirmado → enviado → entregado; cancelado. */
export const ORDER_STATUSES = ['nuevo', 'confirmado', 'enviado', 'entregado', 'cancelado'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderCustomer {
  name: string;
  phone: string;
  email?: string;
  city: string;
  address: string;
  notes?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  slug?: string;
  sku?: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderHistoryEntry {
  status: OrderStatus;
  note?: string;
  createdAt: string;
  by?: string;
}

export interface Order {
  id: string;
  number: string;
  status: OrderStatus;
  statusLabel?: string;
  /** Enlace wa.me con el resumen, generado por el backend. */
  whatsappUrl?: string;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  createdAt: string;
  updatedAt?: string;
  history: OrderHistoryEntry[];
}
