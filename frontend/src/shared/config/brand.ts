/**
 * Identidad visual de TecnoBray (colores del logo). Son los valores por defecto:
 * la tienda puede cambiarlos desde Configuración (primaryColor / secondaryColor / accentColor).
 *
 * - primary   #0B1E3F azul marino del "Tecno": botones principales, encabezados, navegación.
 * - secondary #071630 marino profundo: barra de anuncio, pie de página, barra lateral del panel.
 * - accent    #84C43A verde lima del "Bray": CTA de compra, insignias, resaltados (texto marino encima).
 *   Para texto/enlaces verdes sobre blanco se usa una versión oscurecida (--brand-accent-text, ≥ 4.5:1).
 */
export const BRAND_COLORS = {
  primary: '#0B1E3F',
  secondary: '#071630',
  accent: '#84C43A',
} as const;

/** Tinta (texto oscuro) de la marca. */
export const BRAND_INK = '#0B1E3F';

/** Recursos estáticos de la marca. El logo se dibuja en SVG (BrandWordmark); las medidas son para un logo cargado. */
export const BRAND_ASSETS = {
  logoWidth: 488,
  logoHeight: 108,
  icon: '/favicon.svg',
  appleIcon: '/brand/apple-touch-icon.png',
} as const;
