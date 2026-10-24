import * as Yup from 'yup';
import { arr, asRecord, bool, num, optStr, str } from '@/shared/api/normalize';

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  imageUrl?: string;
  sortOrder: number;
  active: boolean;
  productCount: number;
}

export function toAdminCategory(raw: unknown): AdminCategory {
  const r = asRecord(raw);
  return {
    id: str(r.id),
    name: str(r.name),
    slug: str(r.slug),
    description: str(r.description),
    parentId: optStr(r.parentId) ?? null,
    imageUrl: optStr(r.thumbUrl ?? r.imageUrl),
    sortOrder: num(r.sortOrder ?? r.position, 0),
    active: bool(r.active ?? r.isActive, true),
    productCount: num(r.productCount, 0),
  };
}

export function toAdminCategories(raw: unknown): AdminCategory[] {
  const list = Array.isArray(raw) ? raw : arr(asRecord(raw).items);
  return list.map(toAdminCategory).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'es'));
}

/** Ordena padres seguidos de sus hijos (un nivel), para tablas y selects. */
export function sortAsTree(list: AdminCategory[]): Array<AdminCategory & { depth: number }> {
  const roots = list.filter((c) => !c.parentId || !list.some((p) => p.id === c.parentId));
  return roots.flatMap((root) => [
    { ...root, depth: 0 },
    ...list.filter((c) => c.parentId === root.id).map((c) => ({ ...c, depth: 1 })),
  ]);
}

export interface CategoryFormValues {
  name: string;
  slug: string;
  description: string;
  parentId: string;
  sortOrder: number | '';
  active: boolean;
}

export function categoryToForm(c?: AdminCategory): CategoryFormValues {
  return {
    name: c?.name ?? '',
    slug: c?.slug ?? '',
    description: c?.description ?? '',
    parentId: c?.parentId ?? '',
    sortOrder: c?.sortOrder ?? 0,
    active: c?.active ?? true,
  };
}

export function formToCategoryPayload(v: CategoryFormValues) {
  const slug = v.slug.trim();
  return {
    name: v.name.trim(),
    ...(slug ? { slug } : {}),
    description: v.description.trim() || null,
    parentId: v.parentId || null,
    sortOrder: Number(v.sortOrder) || 0,
    active: v.active,
  };
}

export const categorySchema = Yup.object({
  name: Yup.string().trim().min(2, 'Mínimo 2 caracteres.').max(120, 'Máximo 120 caracteres.').required('El nombre es obligatorio.'),
  slug: Yup.string().trim().max(140).matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Solo minúsculas, números y guiones.',
    excludeEmptyString: true,
  }),
  description: Yup.string().max(500, 'Máximo 500 caracteres.'),
  parentId: Yup.string(),
  sortOrder: Yup.number().typeError('Debe ser un número.').integer().min(0).max(10000),
  active: Yup.boolean(),
});
