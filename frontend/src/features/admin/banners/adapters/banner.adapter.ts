import * as Yup from 'yup';
import { arr, asRecord, bool, num, optStr, str } from '@/shared/api/normalize';

export interface AdminBanner {
  id: string;
  title: string;
  text: string;
  linkUrl: string;
  buttonText: string;
  imageUrl?: string;
  sortOrder: number;
  active: boolean;
}

export function toAdminBanner(raw: unknown): AdminBanner {
  const r = asRecord(raw);
  return {
    id: str(r.id),
    title: str(r.title),
    text: str(r.text ?? r.subtitle),
    linkUrl: str(r.linkUrl),
    buttonText: str(r.buttonText),
    imageUrl: optStr(r.imageUrl ?? r.thumbUrl),
    sortOrder: num(r.sortOrder ?? r.position, 0),
    active: bool(r.active ?? r.isActive, true),
  };
}

export function toAdminBanners(raw: unknown): AdminBanner[] {
  const list = Array.isArray(raw) ? raw : arr(asRecord(raw).items);
  return list.map(toAdminBanner).sort((a, b) => a.sortOrder - b.sortOrder);
}

export interface BannerFormValues {
  title: string;
  text: string;
  linkUrl: string;
  buttonText: string;
  sortOrder: number | '';
  active: boolean;
}

export function bannerToForm(b?: AdminBanner): BannerFormValues {
  return {
    title: b?.title ?? '',
    text: b?.text ?? '',
    linkUrl: b?.linkUrl ?? '',
    buttonText: b?.buttonText ?? '',
    sortOrder: b?.sortOrder ?? 0,
    active: b?.active ?? true,
  };
}

export function formToBannerPayload(v: BannerFormValues) {
  return {
    title: v.title.trim(),
    text: v.text.trim(),
    linkUrl: v.linkUrl.trim() || null,
    buttonText: v.buttonText.trim() || null,
    sortOrder: Number(v.sortOrder) || 0,
    active: v.active,
  };
}

/** Enlace interno (/productos) o URL https. */
export const LINK_REGEX = /^(\/(?!\/)[^\s]*|https?:\/\/[^\s]+)$/;

export const bannerSchema = Yup.object({
  title: Yup.string().trim().min(2, 'Mínimo 2 caracteres.').max(120, 'Máximo 120 caracteres.').required('El título es obligatorio.'),
  text: Yup.string().max(300, 'Máximo 300 caracteres.'),
  linkUrl: Yup.string().trim().max(500).matches(LINK_REGEX, { message: 'Usa una ruta interna (/productos) o una URL https://', excludeEmptyString: true }),
  buttonText: Yup.string().max(40, 'Máximo 40 caracteres.'),
  sortOrder: Yup.number().typeError('Debe ser un número.').integer().min(0),
  active: Yup.boolean(),
});
