import * as Yup from 'yup';
import { arr, asRecord, bool, num, optStr, str } from '@/shared/api/normalize';

export interface SectionProduct {
  id: string;
  name: string;
  sku: string;
  thumbUrl?: string;
  active: boolean;
}

export interface AdminSection {
  id: string;
  title: string;
  subtitle: string;
  productIds: string[];
  products: SectionProduct[];
  sortOrder: number;
  active: boolean;
}

export function toSectionProduct(raw: unknown): SectionProduct {
  const r = asRecord(raw);
  return {
    id: str(r.id),
    name: str(r.name),
    sku: str(r.sku),
    thumbUrl: optStr(r.thumbUrl ?? r.mainImageThumbUrl),
    active: bool(r.active, true),
  };
}

export function toAdminSection(raw: unknown): AdminSection {
  const r = asRecord(raw);
  return {
    id: str(r.id),
    title: str(r.title),
    subtitle: str(r.subtitle),
    productIds: arr(r.productIds).map((x) => str(x)),
    products: arr(r.products).map(toSectionProduct),
    sortOrder: num(r.sortOrder, 0),
    active: bool(r.active, true),
  };
}

export function toAdminSections(raw: unknown): AdminSection[] {
  return arr(Array.isArray(raw) ? raw : asRecord(raw).items)
    .map(toAdminSection)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export interface SectionFormValues {
  title: string;
  subtitle: string;
  products: SectionProduct[];
  sortOrder: number | '';
  active: boolean;
}

export const MAX_SECTION_PRODUCTS = 24;

export const sectionSchema = Yup.object({
  title: Yup.string().trim().min(2, 'Mínimo 2 caracteres.').max(120, 'Máximo 120 caracteres.').required('El título es obligatorio.'),
  subtitle: Yup.string().max(300, 'Máximo 300 caracteres.'),
  products: Yup.array().min(1, 'Agrega al menos un producto.').max(MAX_SECTION_PRODUCTS, `Máximo ${MAX_SECTION_PRODUCTS} productos.`),
  sortOrder: Yup.number().typeError('Debe ser un número.').integer().min(0),
  active: Yup.boolean(),
});

export function formToSectionPayload(v: SectionFormValues) {
  return {
    title: v.title.trim(),
    subtitle: v.subtitle.trim(),
    productIds: v.products.map((p) => p.id),
    sortOrder: Number(v.sortOrder) || 0,
    active: v.active,
  };
}
