import * as Yup from 'yup';
import { arr, asRecord, bool, num, optStr, str } from '@/shared/api/normalize';

export interface AdminBrand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  active: boolean;
  productCount: number;
}

export function toAdminBrand(raw: unknown): AdminBrand {
  const r = asRecord(raw);
  return {
    id: str(r.id),
    name: str(r.name),
    slug: str(r.slug),
    logoUrl: optStr(r.logoUrl),
    active: bool(r.active ?? r.isActive, true),
    productCount: num(r.productCount, 0),
  };
}

export function toAdminBrands(raw: unknown): AdminBrand[] {
  const list = Array.isArray(raw) ? raw : arr(asRecord(raw).items);
  return list.map(toAdminBrand).sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export interface BrandFormValues {
  name: string;
  slug: string;
  active: boolean;
}

export const brandSchema = Yup.object({
  name: Yup.string().trim().min(1, 'Escribe el nombre.').max(120, 'Máximo 120 caracteres.').required('El nombre es obligatorio.'),
  slug: Yup.string().trim().max(140).matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Solo minúsculas, números y guiones.',
    excludeEmptyString: true,
  }),
  active: Yup.boolean(),
});

export function formToBrandPayload(v: BrandFormValues) {
  const slug = v.slug.trim();
  return { name: v.name.trim(), ...(slug ? { slug } : {}), active: v.active };
}
