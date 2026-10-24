import { arr, asRecord, num, optStr, str } from '@/shared/api/normalize';
import { BRAND_COLORS } from '@/shared/config/brand';
import type { PolicyPage, StoreSettings } from '@/shared/types/domain';

export const DEFAULT_POLICIES: PolicyPage[] = [
  {
    slug: 'envios',
    title: 'Política de envíos',
    content:
      'Realizamos envíos a toda Colombia. Los tiempos de entrega varían entre 1 y 5 días hábiles según la ciudad de destino.',
  },
  {
    slug: 'garantias',
    title: 'Garantías',
    content:
      'Todos nuestros productos cuentan con garantía. Conserva tu factura y comunícate con nosotros por WhatsApp para gestionarla.',
  },
  {
    slug: 'devoluciones',
    title: 'Cambios y devoluciones',
    content: 'Tienes derecho de retracto dentro de los 5 días hábiles siguientes a la entrega, según la Ley 1480 de 2011.',
  },
  {
    slug: 'privacidad',
    title: 'Política de privacidad',
    content:
      'Tratamos tus datos personales conforme a la Ley 1581 de 2012. Solo los usamos para gestionar tus pedidos y comunicarnos contigo.',
  },
  {
    slug: 'terminos',
    title: 'Términos y condiciones',
    content: 'Al realizar un pedido en TecnoBray aceptas estos términos y condiciones de compra.',
  },
];

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'TecnoBray',
  tagline: 'Tecnología que te acompaña',
  colors: { primary: BRAND_COLORS.primary, secondary: BRAND_COLORS.secondary, accent: BRAND_COLORS.accent },
  contact: { city: 'Colombia' },
  social: {},
  shippingText: 'Envíos a toda Colombia',
  seo: {
    title: 'TecnoBray | Celulares, accesorios, audio y computadores',
    description:
      'Compra celulares, accesorios, audio y computadores en TecnoBray. Envíos a toda Colombia, garantía y pago contra entrega.',
  },
  policies: DEFAULT_POLICIES,
};

/** Primera línea no vacía (para la barra de anuncio). */
function firstLine(text: string | undefined): string | undefined {
  return text?.split(/\r?\n/).map((l) => l.trim()).find(Boolean);
}

const HEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

function color(value: unknown, fallback: string): string {
  const s = str(value).trim();
  return HEX.test(s) ? s : fallback;
}

function mapPolicy(raw: unknown): PolicyPage | null {
  const r = asRecord(raw);
  const slug = str(r.slug ?? r.key);
  if (!slug) return null;
  return { slug, title: str(r.title, slug), content: str(r.content ?? r.body ?? r.html) };
}

/**
 * Acepta settings planos ({storeName, primaryColor, whatsapp, ...}) o anidados
 * ({colors:{primary}, contact:{...}, social:{...}}). Completa con valores por defecto.
 */
export function toStoreSettings(raw: unknown): StoreSettings {
  const r = asRecord(raw);
  const colors = asRecord(r.colors ?? r.theme);
  const contact = asRecord(r.contact);
  const social = asRecord(r.social ?? r.socialLinks);
  const seo = asRecord(r.seo);
  const policiesRaw = arr(r.policies ?? r.pages);
  const policies = policiesRaw.map(mapPolicy).filter((p): p is PolicyPage => p !== null);
  const d = DEFAULT_SETTINGS;

  return {
    storeName: str(r.storeName ?? r.name, d.storeName) || d.storeName,
    tagline: optStr(r.tagline ?? r.slogan) ?? d.tagline,
    logoUrl: optStr(r.logoUrl ?? r.logo),
    logoSmallUrl: optStr(r.logoSmallUrl),
    faviconUrl: optStr(r.faviconUrl ?? r.favicon),
    appleTouchIconUrl: optStr(r.appleTouchIconUrl),
    colors: {
      primary: color(colors.primary ?? r.primaryColor, d.colors.primary),
      secondary: color(colors.secondary ?? r.secondaryColor, d.colors.secondary),
      accent: color(r.accentColor ?? colors.accent, d.colors.accent),
    },
    contact: {
      phone: optStr(contact.phone ?? r.phone),
      whatsapp: optStr(contact.whatsapp ?? r.whatsapp ?? r.whatsappNumber),
      email: optStr(contact.email ?? r.email),
      address: optStr(contact.address ?? r.address),
      city: optStr(contact.city ?? r.city) ?? d.contact.city,
      schedule: optStr(contact.schedule ?? r.schedule ?? r.businessHours),
    },
    social: {
      facebook: optStr(social.facebook ?? r.facebookUrl),
      instagram: optStr(social.instagram ?? r.instagramUrl),
      tiktok: optStr(social.tiktok ?? r.tiktokUrl),
      youtube: optStr(social.youtube ?? r.youtubeUrl),
      x: optStr(social.x ?? social.twitter ?? r.xUrl),
    },
    shippingText: firstLine(optStr(r.shippingText ?? r.shippingInfo)) ?? d.shippingText,
    shippingInfo: optStr(r.shippingInfo ?? r.shippingText),
    maxQuantityPerItem: num(r.maxQuantityPerItem, 10),
    announcement: optStr(str(r.announcement ?? r.announcementText).trim()),
    seo: {
      title: optStr(seo.title ?? r.seoTitle) ?? d.seo.title,
      description: optStr(seo.description ?? r.seoDescription) ?? d.seo.description,
    },
    policies: policies.length > 0 ? policies : d.policies,
  };
}
