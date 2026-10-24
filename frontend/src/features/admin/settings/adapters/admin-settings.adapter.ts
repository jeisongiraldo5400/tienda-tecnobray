import * as Yup from 'yup';
import { arr, asRecord, num, optStr, str } from '@/shared/api/normalize';
import { BRAND_COLORS } from '@/shared/config/brand';

export const SOCIAL_KEYS = ['facebook', 'instagram', 'tiktok', 'youtube', 'x'] as const;
export type SocialKey = (typeof SOCIAL_KEYS)[number];
export const SOCIAL_LABELS: Record<SocialKey, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  x: 'X (Twitter)',
};

export interface AdminSettings {
  storeName: string;
  tagline: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  seoTitle: string;
  seoDescription: string;
  announcement: string;
  whatsapp: string;
  phone: string;
  email: string;
  address: string;
  social: Record<SocialKey, string>;
  shippingInfo: string;
  lowStockThreshold: number;
  updatedAt?: string;
}

export function toAdminSettings(raw: unknown): AdminSettings {
  const r = asRecord(raw);
  const social = asRecord(r.social);
  return {
    storeName: str(r.storeName, 'TecnoBray'),
    tagline: str(r.tagline),
    logoUrl: optStr(r.logoUrl),
    faviconUrl: optStr(r.faviconUrl),
    primaryColor: str(r.primaryColor, BRAND_COLORS.primary),
    secondaryColor: str(r.secondaryColor, BRAND_COLORS.secondary),
    accentColor: str(r.accentColor, BRAND_COLORS.accent),
    seoTitle: str(r.seoTitle),
    seoDescription: str(r.seoDescription),
    announcement: str(r.announcement),
    whatsapp: str(r.whatsapp),
    phone: str(r.phone),
    email: str(r.email),
    address: str(r.address),
    social: Object.fromEntries(SOCIAL_KEYS.map((k) => [k, str(social[k])])) as Record<SocialKey, string>,
    shippingInfo: str(r.shippingInfo),
    lowStockThreshold: num(r.lowStockThreshold, 5),
    updatedAt: optStr(r.updatedAt),
  };
}

export type SettingsFormValues = Omit<AdminSettings, 'logoUrl' | 'faviconUrl' | 'updatedAt'>;

export function settingsToForm(s: AdminSettings): SettingsFormValues {
  const { logoUrl: _l, faviconUrl: _f, updatedAt: _u, ...rest } = s;
  return { ...rest, social: { ...rest.social } };
}

/** Normaliza para PATCH /admin/settings (WhatsApp solo dígitos con indicativo). */
export function formToSettingsPayload(v: SettingsFormValues) {
  let whatsapp = v.whatsapp.replace(/\D/g, '');
  if (whatsapp.length === 10 && whatsapp.startsWith('3')) whatsapp = `57${whatsapp}`;
  return {
    storeName: v.storeName.trim(),
    tagline: v.tagline.trim(),
    primaryColor: v.primaryColor,
    secondaryColor: v.secondaryColor,
    accentColor: v.accentColor,
    seoTitle: v.seoTitle.trim(),
    seoDescription: v.seoDescription.trim(),
    announcement: v.announcement.trim(),
    whatsapp,
    phone: v.phone.trim(),
    email: v.email.trim(),
    address: v.address.trim(),
    social: Object.fromEntries(SOCIAL_KEYS.map((k) => [k, v.social[k].trim()])),
    shippingInfo: v.shippingInfo.trim(),
    lowStockThreshold: Number(v.lowStockThreshold) || 0,
  };
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const httpsOrEmpty = Yup.string().trim().matches(/^https:\/\/[^\s]+$/, { message: 'Debe iniciar con https://', excludeEmptyString: true });

export const settingsSchema = Yup.object({
  storeName: Yup.string().trim().min(2, 'Mínimo 2 caracteres.').max(80, 'Máximo 80 caracteres.').required('El nombre es obligatorio.'),
  tagline: Yup.string().max(160, 'Máximo 160 caracteres.'),
  primaryColor: Yup.string().matches(HEX, 'Color inválido (#RRGGBB).').required(),
  secondaryColor: Yup.string().matches(HEX, 'Color inválido (#RRGGBB).').required(),
  accentColor: Yup.string().matches(HEX, 'Color inválido (#RRGGBB).').required(),
  seoTitle: Yup.string().max(70, 'Máximo 70 caracteres.'),
  seoDescription: Yup.string().max(170, 'Máximo 170 caracteres.'),
  announcement: Yup.string().max(200, 'Máximo 200 caracteres.'),
  whatsapp: Yup.string().test('wa', 'Escribe 10 a 15 dígitos (ej. 573001234567).', (v) => {
    const d = (v ?? '').replace(/\D/g, '');
    return d.length === 0 || (d.length >= 10 && d.length <= 15);
  }),
  phone: Yup.string().max(30, 'Máximo 30 caracteres.'),
  email: Yup.string().trim().email('Correo inválido.').max(160),
  address: Yup.string().max(250, 'Máximo 250 caracteres.'),
  social: Yup.object(Object.fromEntries(SOCIAL_KEYS.map((k) => [k, httpsOrEmpty]))),
  shippingInfo: Yup.string().max(2000, 'Máximo 2000 caracteres.'),
  lowStockThreshold: Yup.number().typeError('Debe ser un número.').integer().min(0).max(1000),
});

export interface AdminPolicyPage {
  slug: string;
  title: string;
  content: string;
  updatedAt?: string;
}

export function toAdminPages(raw: unknown): AdminPolicyPage[] {
  return arr(Array.isArray(raw) ? raw : asRecord(raw).items).map((p) => {
    const r = asRecord(p);
    return { slug: str(r.slug), title: str(r.title), content: str(r.content), updatedAt: optStr(r.updatedAt) };
  });
}

export const pageSchema = Yup.object({
  title: Yup.string().trim().min(2, 'Mínimo 2 caracteres.').max(120, 'Máximo 120 caracteres.').required('El título es obligatorio.'),
  content: Yup.string().max(50000, 'Máximo 50.000 caracteres.'),
});
